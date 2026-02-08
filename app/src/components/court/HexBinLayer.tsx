'use client';

import { useMemo } from 'react';
import { hexbin as d3Hexbin } from 'd3-hexbin';
import * as d3 from 'd3';
import type { ShotEvent } from '@/types/nba';
import type { CoordinateMapper } from '@/lib/coordinates';
import { SVG } from '@/lib/constants';

export interface HexHoverInfo {
  x: number;
  y: number;
  makes: number;
  attempts: number;
  fgPct: number;
}

interface HexBinLayerProps {
  shots: ShotEvent[];
  mapper: CoordinateMapper;
  onHexHover: (info: HexHoverInfo | null) => void;
}

const LEAGUE_AVG_FG = 0.47;
const HEX_RADIUS = 18;
const MIN_SHOTS = 2;

export default function HexBinLayer({ shots, mapper, onHexHover }: HexBinLayerProps) {
  const { bins, colorScale, opacityScale, hexPath } = useMemo(() => {
    const points = shots.map((s) => ({
      x: mapper.x(s.locX),
      y: mapper.y(s.locY),
      made: s.made,
    }));

    const hexbinGen = d3Hexbin<{ x: number; y: number; made: boolean }>()
      .x((d) => d.x)
      .y((d) => d.y)
      .radius(HEX_RADIUS)
      .extent([[0, 0], [SVG.WIDTH, SVG.HEIGHT]]);

    const rawBins = hexbinGen(points).filter((bin) => bin.length >= MIN_SHOTS);

    const color = d3.scaleDiverging<string>()
      .domain([0, LEAGUE_AVG_FG, 1])
      .interpolator(d3.interpolateRgbBasis(['#3b82f6', '#94a3b8', '#ef4444']));

    const maxCount = d3.max(rawBins, (b) => b.length) ?? 1;
    const opacity = d3.scaleLinear()
      .domain([MIN_SHOTS, maxCount])
      .range([0.4, 0.95])
      .clamp(true);

    return {
      bins: rawBins,
      colorScale: color,
      opacityScale: opacity,
      hexPath: hexbinGen.hexagon(),
    };
  }, [shots, mapper]);

  return (
    <g>
      {bins.map((bin, i) => {
        const makes = bin.filter((d) => d.made).length;
        const attempts = bin.length;
        const fgPct = makes / attempts;

        return (
          <path
            key={i}
            d={hexPath}
            transform={`translate(${bin.x},${bin.y})`}
            fill={colorScale(fgPct)}
            fillOpacity={opacityScale(attempts)}
            stroke="#fff"
            strokeWidth={0.5}
            strokeOpacity={0.3}
            className="cursor-pointer"
            onMouseEnter={() =>
              onHexHover({ x: bin.x, y: bin.y, makes, attempts, fgPct })
            }
            onMouseLeave={() => onHexHover(null)}
          />
        );
      })}
    </g>
  );
}
