'use client';

import { ReactNode } from 'react';
import { createCoordinateMapper, type CoordinateMapper } from '@/lib/coordinates';
import { SVG } from '@/lib/constants';

interface CourtProps {
  children?: (mapper: CoordinateMapper) => ReactNode;
  width?: number;
  height?: number;
}

const COURT_COLOR = '#1a1a2e';
const LINE_COLOR = '#ffffff';
const LINE_WIDTH = 1.5;

/**
 * Half-court SVG with all NBA court markings.
 * Uses render-prop: children receives a CoordinateMapper for plotting data.
 *
 * All coordinates in NBA units (tenths of feet).
 * Basket at SVG bottom-center, half-court line at top.
 */
export default function Court({ children, width, height }: CourtProps) {
  const mapper = createCoordinateMapper();

  // Court boundaries
  const courtLeft = 0;
  const courtRight = SVG.WIDTH; // 500
  const courtTop = 0;
  const courtBottom = SVG.HEIGHT; // 470

  // Basket position in SVG coords
  const basketX = mapper.x(0); // 250
  const basketY = mapper.y(0); // ~417.5

  // Paint (key) — 16ft wide, 19ft from baseline
  const paintHalfWidth = 80; // 8ft * 10
  const paintHeight = 190; // 19ft * 10
  const paintLeft = basketX - paintHalfWidth;
  const paintRight = basketX + paintHalfWidth;
  const paintTop = basketY - paintHeight;

  // Free throw circle — 6ft radius
  const ftRadius = 60;

  // 3-point arc
  const threeRadius = 237.5; // 23.75ft * 10
  const cornerThreeY = basketY; // Y position where corner meets arc
  const cornerThreeFromBaseline = 140; // 14ft * 10 — length of corner 3 line

  // Restricted area — 4ft radius
  const restrictedRadius = 40;

  // Backboard
  const backboardWidth = 60; // 6ft * 10
  const backboardY = basketY + 10; // just behind basket

  // Basket
  const basketRadius = 7.5;

  return (
    <svg
      viewBox={`${-SVG.PADDING} ${-SVG.PADDING} ${SVG.WIDTH + SVG.PADDING * 2} ${SVG.HEIGHT + SVG.PADDING * 2}`}
      width={width}
      height={height}
      className="w-full h-auto max-h-[600px]"
      style={{ background: COURT_COLOR }}
    >
      {/* Court boundary */}
      <rect
        x={courtLeft}
        y={courtTop}
        width={courtRight}
        height={courtBottom}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={LINE_WIDTH}
      />

      {/* Half-court line (top) */}
      <line
        x1={courtLeft}
        y1={courtTop}
        x2={courtRight}
        y2={courtTop}
        stroke={LINE_COLOR}
        strokeWidth={LINE_WIDTH}
      />

      {/* Center circle (half arc, visible at top) */}
      <path
        d={describeArc(basketX, courtTop, 60, 0, 180)}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={LINE_WIDTH}
      />

      {/* Paint / Key */}
      <rect
        x={paintLeft}
        y={paintTop}
        width={paintHalfWidth * 2}
        height={paintHeight + (courtBottom - basketY)}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={LINE_WIDTH}
      />

      {/* Free throw line */}
      <line
        x1={paintLeft}
        y1={paintTop}
        x2={paintRight}
        y2={paintTop}
        stroke={LINE_COLOR}
        strokeWidth={LINE_WIDTH}
      />

      {/* Free throw circle (full) */}
      <circle
        cx={basketX}
        cy={paintTop}
        r={ftRadius}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={LINE_WIDTH}
        strokeDasharray="8 8"
      />
      {/* Free throw circle — solid top half */}
      <path
        d={describeArc(basketX, paintTop, ftRadius, 180, 360)}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={LINE_WIDTH}
      />

      {/* 3-point arc */}
      <path
        d={`
          M ${basketX - 220} ${courtBottom}
          L ${basketX - 220} ${cornerThreeY - cornerThreeFromBaseline}
          ${describeArcPath(basketX, basketY, threeRadius,
            Math.acos(220 / threeRadius) * (180 / Math.PI),
            180 - Math.acos(220 / threeRadius) * (180 / Math.PI)
          )}
          L ${basketX + 220} ${courtBottom}
        `}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={LINE_WIDTH}
      />

      {/* Restricted area arc */}
      <path
        d={describeArc(basketX, basketY, restrictedRadius, 0, 180)}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={LINE_WIDTH}
      />
      {/* Restricted area vertical lines */}
      <line
        x1={basketX - restrictedRadius}
        y1={basketY}
        x2={basketX - restrictedRadius}
        y2={courtBottom}
        stroke={LINE_COLOR}
        strokeWidth={LINE_WIDTH}
      />
      <line
        x1={basketX + restrictedRadius}
        y1={basketY}
        x2={basketX + restrictedRadius}
        y2={courtBottom}
        stroke={LINE_COLOR}
        strokeWidth={LINE_WIDTH}
      />

      {/* Backboard */}
      <line
        x1={basketX - backboardWidth / 2}
        y1={backboardY}
        x2={basketX + backboardWidth / 2}
        y2={backboardY}
        stroke={LINE_COLOR}
        strokeWidth={2}
      />

      {/* Basket ring */}
      <circle
        cx={basketX}
        cy={basketY}
        r={basketRadius}
        fill="none"
        stroke="#ff6b35"
        strokeWidth={2}
      />

      {/* Data layer — children get the coordinate mapper */}
      {children?.(mapper)}
    </svg>
  );
}

/** Helper: SVG arc path for a circle arc (clockwise, angles in degrees from top) */
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/** Helper: SVG arc path segment (no M command) for embedding in larger paths */
function describeArcPath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  // Convert degrees to SVG convention (0 = right, going clockwise)
  // We want arc from left side to right side, going over the top
  const startRad = ((180 + startAngleDeg) * Math.PI) / 180;
  const endRad = ((180 + endAngleDeg) * Math.PI) / 180;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy - r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy - r * Math.sin(endRad);

  const sweepAngle = endAngleDeg - startAngleDeg;
  const largeArc = Math.abs(sweepAngle) > 180 ? 1 : 0;

  return `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}
