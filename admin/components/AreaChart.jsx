/*
 * AreaChart — animated performance metrics area with reveal clip.
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

export default function AreaChart({ data = DEFAULT_DATA }) {
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

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(d.x)} ${yScale(d.y)}`)
    .join(" ");

  const areaPath =
    `M ${xScale(data[0].x)} ${H - pad} ` +
    data.map((d) => `L ${xScale(d.x)} ${yScale(d.y)}`).join(" ") +
    ` L ${xScale(data[data.length - 1].x)} ${H - pad} Z`;

  const revealProgress = interpolate(frame, [0, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const revealWidth = revealProgress * W;

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
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4361ee" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4361ee" stopOpacity="0" />
            </linearGradient>
            <clipPath id="revealClip">
              <rect x="0" y="0" width={revealWidth} height={H} />
            </clipPath>
          </defs>

          {/* Area fill with clip */}
          <path
            d={areaPath}
            fill="url(#areaGradient)"
            clipPath="url(#revealClip)"
          />

          {/* Line with clip */}
          <path
            d={linePath}
            fill="none"
            stroke="#4361ee"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath="url(#revealClip)"
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
                r={4 * pointProgress}
                fill="white"
                stroke="#4361ee"
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
          Performance Metrics
        </div>
      </div>
    </div>
  );
}
