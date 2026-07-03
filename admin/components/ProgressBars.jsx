/*
 * ProgressBars — animated skill/metric bars.
 * Sample data replaced with real admin-dashboard metrics via the `skills` prop.
 */

"use client";

import { useCurrentFrame, interpolate } from "remotion";

// Real corresponding metrics are injected via the `skills` prop by the
// Analysis page. The default mirrors the shape { label, value, color }.
const DEFAULT_SKILLS = [
  { label: "Views Today", value: 0, color: "#4361ee" },
  { label: "Visitors Today", value: 0, color: "#f72585" },
  { label: "Views This Week", value: 0, color: "#4cc9f0" },
  { label: "Visitors This Week", value: 0, color: "#7209b7" },
];

export default function ProgressBars({ skills = DEFAULT_SKILLS }) {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0f172a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "40px",
      }}
    >
      <div>
        {skills.map((skill, i) => {
          const barProgress = interpolate(
            frame,
            [i * 5, i * 5 + 30],
            [0, skill.value],
            { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
          );

          const labelOpacity = interpolate(
            frame,
            [i * 5, i * 5 + 10],
            [0, 1],
            { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
          );

          return (
            <div
              key={`skill-${i}`}
              style={{
                marginBottom: i < skills.length - 1 ? "22px" : "0",
                opacity: labelOpacity,
              }}
            >
              {/* Label row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    color: "white",
                    fontSize: "16px",
                    fontWeight: "600",
                  }}
                >
                  {skill.label}
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                >
                  {Math.round(barProgress)}%
                </span>
              </div>

              {/* Bar track */}
              <div
                style={{
                  width: "100%",
                  height: "14px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: "7px",
                  overflow: "hidden",
                }}
              >
                {/* Bar fill */}
                <div
                  style={{
                    width: `${barProgress}%`,
                    height: "100%",
                    backgroundColor: skill.color,
                    borderRadius: "7px",
                    boxShadow: `0 0 10px ${skill.color}40`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
