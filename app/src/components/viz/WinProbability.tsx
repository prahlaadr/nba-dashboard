'use client';

import { useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import type { ScoreMoment, GameMeta } from '@/types/nba';
import { getTeamColors } from '@/lib/teamColors';
import { QUARTERS, GAME_LENGTH_SECONDS } from '@/lib/constants';

interface WinProbabilityProps {
  moments: ScoreMoment[];
  meta: GameMeta;
}

const MARGIN = { top: 20, right: 20, bottom: 30, left: 40 };
const WIDTH = 500;
const HEIGHT = 200;
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;

export default function WinProbability({ moments, meta }: WinProbabilityProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverInfo, setHoverInfo] = useState<ScoreMoment | null>(null);

  const homeColors = getTeamColors(meta.homeTeam.abbreviation);
  const awayColors = getTeamColors(meta.awayTeam.abbreviation);

  const { xScale, yScale, areaAbove, areaBelow, linePath } = useMemo(() => {
    const maxDiff = Math.max(
      10,
      d3.max(moments, (d) => Math.abs(d.differential)) ?? 10
    );

    const x = d3.scaleLinear().domain([0, GAME_LENGTH_SECONDS]).range([0, INNER_W]);
    const y = d3
      .scaleLinear()
      .domain([-maxDiff - 2, maxDiff + 2])
      .range([INNER_H, 0]);

    const line = d3
      .line<ScoreMoment>()
      .x((d) => x(d.gameSeconds))
      .y((d) => y(d.differential))
      .curve(d3.curveStepAfter);

    const areaPos = d3
      .area<ScoreMoment>()
      .x((d) => x(d.gameSeconds))
      .y0(y(0))
      .y1((d) => y(Math.max(0, d.differential)))
      .curve(d3.curveStepAfter);

    const areaNeg = d3
      .area<ScoreMoment>()
      .x((d) => x(d.gameSeconds))
      .y0(y(0))
      .y1((d) => y(Math.min(0, d.differential)))
      .curve(d3.curveStepAfter);

    return {
      xScale: x,
      yScale: y,
      areaAbove: areaPos(moments) ?? '',
      areaBelow: areaNeg(moments) ?? '',
      linePath: line(moments) ?? '',
    };
  }, [moments]);

  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - MARGIN.left;
    const gameSeconds = xScale.invert(mouseX * (WIDTH / rect.width));

    // Find closest moment
    let closest = moments[0];
    for (const m of moments) {
      if (m.gameSeconds <= gameSeconds) closest = m;
      else break;
    }
    setHoverInfo(closest);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white/80">Score Differential</h3>
        {hoverInfo && (
          <div className="text-xs text-white/60">
            {meta.awayTeam.abbreviation} {hoverInfo.scoreAway} - {hoverInfo.scoreHome} {meta.homeTeam.abbreviation}
            <span className="ml-2 text-white/40">
              ({hoverInfo.differential > 0 ? '+' : ''}
              {hoverInfo.differential} {meta.homeTeam.abbreviation})
            </span>
          </div>
        )}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Area fills */}
          <path d={areaAbove} fill={homeColors.primary} opacity={0.2} />
          <path d={areaBelow} fill={awayColors.primary} opacity={0.2} />

          {/* Zero line */}
          <line
            x1={0}
            y1={yScale(0)}
            x2={INNER_W}
            y2={yScale(0)}
            stroke="white"
            strokeOpacity={0.2}
            strokeDasharray="4 4"
          />

          {/* Quarter boundaries */}
          {QUARTERS.slice(1).map((q) => (
            <line
              key={q.label}
              x1={xScale(q.startSeconds)}
              y1={0}
              x2={xScale(q.startSeconds)}
              y2={INNER_H}
              stroke="white"
              strokeOpacity={0.15}
              strokeDasharray="4 4"
            />
          ))}

          {/* Quarter labels */}
          {QUARTERS.map((q, i) => {
            const nextStart =
              i < QUARTERS.length - 1
                ? QUARTERS[i + 1].startSeconds
                : GAME_LENGTH_SECONDS;
            const midX = xScale((q.startSeconds + nextStart) / 2);
            return (
              <text
                key={q.label}
                x={midX}
                y={INNER_H + 20}
                textAnchor="middle"
                fill="white"
                fillOpacity={0.4}
                fontSize={10}
              >
                {q.label}
              </text>
            );
          })}

          {/* Score differential line */}
          <path
            d={linePath}
            fill="none"
            stroke="white"
            strokeWidth={1.5}
            strokeOpacity={0.8}
          />

          {/* Hover crosshair */}
          {hoverInfo && (
            <>
              <line
                x1={xScale(hoverInfo.gameSeconds)}
                y1={0}
                x2={xScale(hoverInfo.gameSeconds)}
                y2={INNER_H}
                stroke="white"
                strokeOpacity={0.5}
                strokeWidth={1}
              />
              <circle
                cx={xScale(hoverInfo.gameSeconds)}
                cy={yScale(hoverInfo.differential)}
                r={4}
                fill="white"
                stroke="none"
              />
            </>
          )}

          {/* Y-axis labels */}
          <text x={-8} y={yScale(0)} textAnchor="end" fill="white" fillOpacity={0.4} fontSize={9} dy={3}>
            0
          </text>

          {/* Team labels on y-axis */}
          <text x={-8} y={4} textAnchor="end" fill={homeColors.primary} fontSize={9} fontWeight={600}>
            {meta.homeTeam.abbreviation}
          </text>
          <text x={-8} y={INNER_H} textAnchor="end" fill={awayColors.primary} fontSize={9} fontWeight={600}>
            {meta.awayTeam.abbreviation}
          </text>

          {/* Invisible hover rect */}
          <rect
            x={0}
            y={0}
            width={INNER_W}
            height={INNER_H}
            fill="transparent"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverInfo(null)}
          />
        </g>
      </svg>
    </div>
  );
}
