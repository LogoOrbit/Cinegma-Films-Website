#!/usr/bin/env bash
# Assemble chunked uploads from the staging branch, optimize each with ffmpeg,
# publish the result to the production branch, then clear the staging files.
set -euo pipefail

PROD_BRANCH="${PROD_BRANCH:-main}"
STAGE_ROOT="assets/videos/_staging"

git config user.name "cinegma-media-bot"
git config user.email "media-bot@users.noreply.github.com"

shopt -s nullglob
manifests=("$STAGE_ROOT"/*/manifest.json)
if [ ${#manifests[@]} -eq 0 ]; then
  echo "No pending uploads."
  exit 0
fi

FINALS=()   # repo path of the published file
OUTS=()     # local optimized file
DIRS=()     # staging dir to remove afterwards

for manifest in "${manifests[@]}"; do
  dir="$(dirname "$manifest")"
  uploadId="$(basename "$dir")"
  mediaType="$(node -p "require('./$manifest').mediaType || 'video'")"
  finalPath="$(node -p "require('./$manifest').finalPath")"
  echo "::group::Processing $uploadId ($mediaType) -> $finalPath"

  # Reassemble the raw file from its ordered part-* chunks.
  raw="$RUNNER_TEMP/${uploadId}.raw"
  : > "$raw"
  for part in $(ls "$dir"/part-* 2>/dev/null | sort); do
    cat "$part" >> "$raw"
  done

  out="$RUNNER_TEMP/out-${uploadId}-$(basename "$finalPath")"
  if [ "$mediaType" = "audio" ]; then
    ffmpeg -y -hide_banner -loglevel error -i "$raw" \
      -vn -c:a libmp3lame -b:a 192k "$out"
  else
    # H.264 + AAC, downscaled to max 1920px wide, web-faststart for fast start.
    ffmpeg -y -hide_banner -loglevel error -i "$raw" \
      -vf "scale='min(1920,iw)':-2" \
      -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p \
      -c:a aac -b:a 128k -movflags +faststart "$out"
  fi

  echo "Optimized: $(du -h "$raw" | cut -f1) -> $(du -h "$out" | cut -f1)"
  echo "::endgroup::"

  FINALS+=("$finalPath")
  OUTS+=("$out")
  DIRS+=("$dir")
done

# --- Publish optimized files to the production branch.
git fetch origin "$PROD_BRANCH"
git checkout -B "$PROD_BRANCH" "origin/$PROD_BRANCH"
for i in "${!FINALS[@]}"; do
  mkdir -p "$(dirname "${FINALS[$i]}")"
  cp "${OUTS[$i]}" "${FINALS[$i]}"
  git add "${FINALS[$i]}"
done
if ! git diff --cached --quiet; then
  git commit -m "media: publish optimized upload(s) [skip ci]"
  git push origin "$PROD_BRANCH"
else
  echo "Nothing new to publish."
fi

# --- Clear the processed staging files.
git fetch origin media-staging
git checkout -B media-staging origin/media-staging
for d in "${DIRS[@]}"; do
  git rm -r --ignore-unmatch "$d" >/dev/null
done
if ! git diff --cached --quiet; then
  git commit -m "media: clear processed staging files [skip ci]"
  git push origin media-staging
else
  echo "Nothing to clean."
fi
