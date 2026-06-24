# Interactive Sound Effects

Drop MP3 files here using the **exact filenames** below. The site's sound
engine (`assets/js/sound-effects.js`) loads any that exist and falls back to
built-in synthesised sounds for anything missing — so you can add them one at
a time and they go live immediately, no code changes needed.

| Filename        | Plays when…                                   | Character                                   |
|-----------------|-----------------------------------------------|---------------------------------------------|
| `hover.mp3`     | Hovering links / buttons / nav                | Very soft UI tick (plays often — keep gentle)|
| `sparkle.mp3`   | Hovering laurels & award cards                | Magical shimmer / twinkle / chime           |
| `cinematic.mp3` | Hovering film posters                         | Deep cinematic swell / soft braam / riser   |
| `click.mp3`     | Clicking buttons / CTAs                       | Crisp mechanical click or soft pop          |
| `shutter.mp3`   | Navigating to another page / clicking a poster| Camera shutter snap ("k-chk")               |
| `whoosh.mp3`    | Mobile menu open/close                        | Short airy whoosh (auto-reversed for close) |
| `blip.mp3`      | Focusing a form field (optional)              | Tiny soft confirm tone                       |
| `toggle.mp3`    | Turning the SFX button on (optional)          | Two-note power-on confirm                    |

## Tips
- **Format:** MP3 (mono is fine and smaller).
- **Keep them short** — especially `hover` and `click`, which fire constantly.
  Trim leading silence so they feel instant.
- **Don't over-normalize** — the engine plays them attenuated; ~-6 to -12 dB
  peak works well. Per-sound levels can be tuned in `sound-effects.js` (`VOL`).
- **Small files** — aim for < ~50 KB each.
- **Licensing:** prefer CC0 / no-attribution sources (Pixabay, Mixkit) or
  check the license on Freesound / Zapsplat.
