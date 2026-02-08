'use client';

import { useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import type { ScoreMoment, GameMeta, ScoringRun } from '@/types/nba';
import type { ScoreProgressionResult } from '@/lib/transformers/winProbability';
import { getTeamColors } from '@/lib/teamColors';

interface WinProbabilityProps {
  data: ScoreProgressionResult;
  meta: GameMeta;
  scoringRuns?: ScoringRun[];
}

const MARGIN = { top: 24, right: 16, bottom: 32, left: 44 };
const WIDTH = 500;
const HEIGHT = 280;
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;

export default function WinProbability({ data, meta, scoringRuns }: WinProbabilityProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverInfo, setHoverInfo] = useState<ScoreMoment | null>(null);

  const homeColors = getTeamColors(meta.homeTeam.abbreviation);
  const awayColors = getTeamColors(meta.awayTeam.abbreviation);

  const { moments, totalSeconds, periods } = data;

  const { xScale, yScale, areaAbove, areaBelow, linePath } = useMemo(() => {
    const maxDiff = Math.max(
      10,
      d3.max(moments, (d) => Math.abs(d.differential)) ?? 10
    );

    const x = d3.scaleLinear().domain([0, totalSeconds]).range([0, INNER_W]);
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
  }, [moments, totalSeconds]);

  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * WIDTH - MARGIN.left;
    const gameSeconds = xScale.invert(mouseX);

    let closest = moments[0];
    for (const m of moments) {
      if (m.gameSeconds <= gameSeconds) closest = m;
      else break;
    }
    setHoverInfo(closest);
  };

  // Format hover info with team colors
  const hoverAway = hoverInfo ? hoverInfo.scoreAway : 0;
  const hoverHome = hoverInfo ? hoverInfo.scoreHome : 0;
  const hoverDiff = hoverInfo ? hoverInfo.differential : 0;
  const leadingColor = hoverDiff > 0 ? homeColors.chart : hoverDiff < 0 ? awayColors.chart : '#6b7280';
  const leadingTeam = hoverDiff > 0 ? meta.homeTeam.abbreviation : hoverDiff < 0 ? meta.awayTeam.abbreviation : '';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-700">Score Timeline</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: homeColors.chart, opacity: 0.5 }} />
            <span className="text-gray-500">{meta.homeTeam.abbreviation} leads</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: awayColors.chart, opacity: 0.5 }} />
            <span className="text-gray-500">{meta.awayTeam.abbreviation} leads</span>
          </span>
        </div>
      </div>

      {/* Hover score display */}
      <div className="h-5 mb-1">
        {hoverInfo && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold tabular-nums" style={{ color: awayColors.chart }}>
              {meta.awayTeam.abbreviation} {hoverAway}
            </span>
            <span className="text-gray-300">-</span>
            <span className="font-semibold tabular-nums" style={{ color: homeColors.chart }}>
              {hoverHome} {meta.homeTeam.abbreviation}
            </span>
            {hoverDiff !== 0 && (
              <span className="font-medium" style={{ color: leadingColor }}>
                {leadingTeam} +{Math.abs(hoverDiff)}
              </span>
            )}
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
          <path d={areaAbove} fill={homeColors.chart} opacity={0.2} />
          <path d={areaBelow} fill={awayColors.chart} opacity={0.2} />

          {/* Scoring run annotations */}
          {scoringRuns?.map((run, i) => {
            const runColor = run.isHome ? homeColors.chart : awayColors.chart;
            const x1 = xScale(run.startSeconds);
            const x2 = xScale(run.endSeconds);
            const labelY = run.isHome ? -4 : -14;
            return (
              <g key={i}>
                {/* Background band */}
                <rect
                  x={x1}
                  y={0}
                  width={Math.max(x2 - x1, 2)}
                  height={INNER_H}
                  fill={runColor}
                  fillOpacity={0.08}
                />
                {/* Dashed edge lines */}
                <line
                  x1={x1} y1={0} x2={x1} y2={INNER_H}
                  stroke={runColor} strokeOpacity={0.3} strokeWidth={1} strokeDasharray="3 3"
                />
                <line
                  x1={x2} y1={0} x2={x2} y2={INNER_H}
                  stroke={runColor} strokeOpacity={0.3} strokeWidth={1} strokeDasharray="3 3"
                />
                {/* Label */}
                <text
                  x={(x1 + x2) / 2}
                  y={labelY}
                  textAnchor="middle"
                  fill={runColor}
                  fontSize={9}
                  fontWeight={700}
                >
                  {run.label} {run.teamTricode}
                </text>
              </g>
            );
          })}

          {/* Zero line */}
          <line
            x1={0}
            y1={yScale(0)}
            x2={INNER_W}
            y2={yScale(0)}
            stroke="#94a3b8"
            strokeOpacity={0.5}
            strokeDasharray="4 4"
          />

          {/* Period boundaries */}
          {periods.slice(1).map((p) => (
            <line
              key={p.label}
              x1={xScale(p.startSeconds)}
              y1={0}
              x2={xScale(p.startSeconds)}
              y2={INNER_H}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          ))}

          {/* Period labels */}
          {periods.map((p, i) => {
            const nextStart =
              i < periods.length - 1
                ? periods[i + 1].startSeconds
                : totalSeconds;
            const midX = xScale((p.startSeconds + nextStart) / 2);
            return (
              <text
                key={p.label}
                x={midX}
                y={INNER_H + 20}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={11}
                fontWeight={500}
              >
                {p.label}
              </text>
            );
          })}

          {/* Y-axis tick labels */}
          {yScale.ticks(5).map((tick) => (
            <g key={tick}>
              <line
                x1={0}
                y1={yScale(tick)}
                x2={INNER_W}
                y2={yScale(tick)}
                stroke="#f1f5f9"
                strokeWidth={tick === 0 ? 0 : 1}
              />
              {tick !== 0 && (
                <text
                  x={-8}
                  y={yScale(tick)}
                  textAnchor="end"
                  fill="#cbd5e1"
                  fontSize={9}
                  dy="0.35em"
                >
                  {tick > 0 ? `+${tick}` : tick}
                </text>
              )}
            </g>
          ))}

          {/* Score differential line */}
          <path
            d={linePath}
            fill="none"
            stroke="#334155"
            strokeWidth={1.5}
          />

          {/* Hover crosshair */}
          {hoverInfo && (
            <>
              <line
                x1={xScale(hoverInfo.gameSeconds)}
                y1={0}
                x2={xScale(hoverInfo.gameSeconds)}
                y2={INNER_H}
                stroke="#64748b"
                strokeOpacity={0.4}
                strokeWidth={1}
              />
              <circle
                cx={xScale(hoverInfo.gameSeconds)}
                cy={yScale(hoverInfo.differential)}
                r={4}
                fill={hoverDiff >= 0 ? homeColors.chart : awayColors.chart}
                stroke="#fff"
                strokeWidth={2}
              />
            </>
          )}

          {/* Team labels on y-axis */}
          <text x={-8} y={8} textAnchor="end" fill={homeColors.chart} fontSize={10} fontWeight={700}>
            {meta.homeTeam.abbreviation}
          </text>
          <text x={-8} y={INNER_H - 2} textAnchor="end" fill={awayColors.chart} fontSize={10} fontWeight={700}>
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
