"use client";

import React from "react";

export type Point = { x: string; y: number };

type Props = {
  data: Point[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
  label?: string;
};

export default function LineChart({ data, width = 640, height = 220, color = "#2563eb", strokeWidth = 2, filled = true, label }: Props) {
  const padding = { top: 16, right: 12, bottom: 24, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const ys = data.map((d) => d.y);
  const maxY = Math.max(1, ...ys);
  const minY = 0;

  const xs = data.map((d) => d.x);
  const n = xs.length;

  const xScale = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * innerW);
  const yScale = (v: number) => innerH - ((v - minY) / (maxY - minY)) * innerH;

  const points = data.map((d, i) => [xScale(i), yScale(d.y)] as const);
  const path = points
    .map((p, i) => (i === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`))
    .join(" ");

  const area = `${path} L ${innerW},${innerH} L 0,${innerH} Z`;

  // y-axis ticks
  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => Math.round((i * maxY) / ticks));

  return (
    <svg width={width} height={height} role="img" aria-label={label || "chart"}>
      <g transform={`translate(${padding.left}, ${padding.top})`}>
        {/* grid + y-axis */}
        {yTicks.map((t, i) => {
          const y = yScale(t);
          return (
            <g key={i}>
              <line x1={0} y1={y} x2={innerW} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              <text x={-8} y={y} textAnchor="end" alignmentBaseline="middle" fontSize={10} fill="#6b7280">
                {t}
              </text>
            </g>
          );
        })}

        {/* x-axis labels (sparse) */}
        {xs.map((d, i) => {
          if (n <= 2 || i % Math.ceil(n / 6) === 0 || i === n - 1) {
            const x = xScale(i);
            return (
              <text key={i} x={x} y={innerH + 14} textAnchor="middle" fontSize={10} fill="#6b7280">
                {d}
              </text>
            );
          }
          return null;
        })}

        {/* area fill */}
        {filled && (
          <path d={area} fill={color + "20"} stroke="none" />
        )}
        {/* line */}
        <path d={path} fill="none" stroke={color} strokeWidth={strokeWidth} />

        {/* endpoints */}
        {points.length > 0 && (
          <>
            <circle cx={points[0][0]} cy={points[0][1]} r={2} fill={color} />
            <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r={3} fill={color} />
          </>
        )}
      </g>
    </svg>
  );
}

