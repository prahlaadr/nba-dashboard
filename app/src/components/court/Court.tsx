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
const LW = 1.5;

/**
 * Half-court SVG with all NBA court markings.
 * Basket at bottom-center, half-court line at top.
 *
 * All dimensions in NBA coordinate units (tenths of feet).
 * SVG viewBox: 500 wide × 470 tall.
 * Basket center: (250, 417.5) in SVG coords.
 */
export default function Court({ children, width, height }: CourtProps) {
  const mapper = createCoordinateMapper();

  // Key positions in SVG coords
  const W = SVG.WIDTH;   // 500
  const H = SVG.HEIGHT;  // 470
  const cx = 250;        // court center X (basket X)
  const by = mapper.y(0); // basket Y ≈ 417.5

  // Paint: 16ft wide (160 units), 19ft tall (190 units) from basket
  const paintW = 160;
  const paintH = 190;
  const paintL = cx - paintW / 2; // 170
  const paintR = cx + paintW / 2; // 330
  const paintT = by - paintH;     // ~227.5 (free throw line Y)

  // Free throw circle: 6ft radius (60 units), centered on free throw line
  const ftR = 60;

  // 3-point: 23.75ft radius (237.5 units) from basket center
  // Corner 3: 22ft (220 units) from basket center, straight lines along sideline
  const threeR = 237.5;
  const cornerX = 220; // half-width of corner 3 from center
  // Where the arc meets the corner line: solve for y at x=220 on circle of radius 237.5
  // y = sqrt(237.5² - 220²) = sqrt(8006.25) ≈ 89.5
  const arcJoinY = Math.sqrt(threeR * threeR - cornerX * cornerX);
  // In SVG coords, the arc endpoints
  const arcLeftX = cx - cornerX;   // 30
  const arcRightX = cx + cornerX;  // 470
  const arcJoinSvgY = by - arcJoinY; // ~328

  // Restricted area: 4ft radius (40 units)
  const raR = 40;

  // Backboard: 6ft wide (60 units)
  const bbW = 60;
  const bbY = by + 10;

  // Basket ring
  const rimR = 7.5;

  // Center circle: 6ft radius (60 units), half-arc at top
  const ccR = 60;

  return (
    <svg
      viewBox={`${-SVG.PADDING} ${-SVG.PADDING} ${W + SVG.PADDING * 2} ${H + SVG.PADDING * 2}`}
      width={width}
      height={height}
      className="w-full h-auto max-h-[600px]"
      style={{ background: COURT_COLOR }}
    >
      {/* Court boundary */}
      <rect x={0} y={0} width={W} height={H} fill="none" stroke={LINE_COLOR} strokeWidth={LW} />

      {/* Center circle — semicircle bowing down into the court */}
      <path
        d={`M ${cx - ccR} 0 A ${ccR} ${ccR} 0 0 0 ${cx + ccR} 0`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={LW}
      />

      {/* Paint / Key rectangle */}
      <rect
        x={paintL} y={paintT}
        width={paintW} height={H - paintT}
        fill="none" stroke={LINE_COLOR} strokeWidth={LW}
      />

      {/* Free throw circle — bottom half (toward basket) solid */}
      <path
        d={`M ${cx - ftR} ${paintT} A ${ftR} ${ftR} 0 0 0 ${cx + ftR} ${paintT}`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={LW}
      />
      {/* Free throw circle — top half (toward half court) dashed */}
      <path
        d={`M ${cx - ftR} ${paintT} A ${ftR} ${ftR} 0 0 1 ${cx + ftR} ${paintT}`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={LW}
        strokeDasharray="8 8"
      />

      {/* 3-point line: corner lines + arc */}
      <path
        d={`
          M ${arcLeftX} ${H}
          L ${arcLeftX} ${arcJoinSvgY}
          A ${threeR} ${threeR} 0 0 1 ${arcRightX} ${arcJoinSvgY}
          L ${arcRightX} ${H}
        `}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={LW}
      />

      {/* Restricted area — semicircle bowing toward half court (upward) */}
      <path
        d={`M ${cx - raR} ${by} A ${raR} ${raR} 0 0 1 ${cx + raR} ${by}`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={LW}
      />
      {/* Restricted area vertical lines to baseline */}
      <line x1={cx - raR} y1={by} x2={cx - raR} y2={H} stroke={LINE_COLOR} strokeWidth={LW} />
      <line x1={cx + raR} y1={by} x2={cx + raR} y2={H} stroke={LINE_COLOR} strokeWidth={LW} />

      {/* Backboard */}
      <line
        x1={cx - bbW / 2} y1={bbY} x2={cx + bbW / 2} y2={bbY}
        stroke={LINE_COLOR} strokeWidth={2}
      />

      {/* Basket ring */}
      <circle cx={cx} cy={by} r={rimR} fill="none" stroke="#ff6b35" strokeWidth={2} />

      {/* Data layer */}
      {children?.(mapper)}
    </svg>
  );
}
