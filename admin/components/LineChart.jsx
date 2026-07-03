/*
 * LineChart — animated revenue/traffic growth line.
 * Sample data replaced with real admin-dashboard metrics via the `data` prop.
 */

"use client";

import { useCurrentFrame, interpolate } from "remotion";

// Real corresponding metrics are injected via the `data` prop by the
// Analysis page. The default mirrors the shape { x, y }.
const DEFAULT_DATA = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 3, y: 0 },
  { x: 4, y: 0 },
  { x: 5, y: 0 },
  { x: 6, y: 0 },
];

export default function LineChart({ data = DEFAULT_DATA }) {
  const frame = useCurrentFrame();

  const W = 600;
  const H = 340;
  const pad = 60;

  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = 0;
  const maxY = Math.max(...ys) * 1.15 || 1;

  const xScale = (x) => pad + ((x - minX) / (maxX - minX || 1)) * (W - pad * 2);
  const yScale = (y) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - pad * 2);

  const points = data.map((d) => `${xScale(d.x)},${yScale(d.y)}`).join(" ");

  const totalLength = 1400;
  const drawProgress = interpolate(frame, [0, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dashOffset = totalLength * (1 - drawProgress);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0f172a",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Animated polyline */}
          <polyline
            points={points}
            fill="none"
            stroke="#4361ee"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={totalLength}
            strokeDashoffset={dashOffset}
          />

          {/* Data points */}
          {data.map((point, i) => {
            const pointProgress = interpolate(
              frame,
              [5 + i * 6, 10 + i * 6],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <circle
                key={`point-${i}`}
                cx={xScale(point.x)}
                cy={yScale(point.y)}
                r={5 * pointProgress}
                fill="#f72585"
                stroke="white"
                strokeWidth="2"
                opacity={pointProgress}
              />
            );
          })}
        </svg>

        {/* Chart title */}
        <div
          style={{
            position: "absolute",
            top: "25px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "28px",
            fontWeight: "bold",
            color: "white",
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            letterSpacing: "-0.5px",
          }}
        >
          Revenue Growth
        </div>
      </div>
    </div>
  );
}
