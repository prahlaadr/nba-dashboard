'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import type { AssistGraph, AssistNode, AssistLink } from '@/types/nba';
import { getTeamColorsByTeamId } from '@/lib/teamColors';

interface SimNode extends AssistNode, d3.SimulationNodeDatum {}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  value: number;
}

interface AssistNetworkProps {
  home: AssistGraph;
  away: AssistGraph;
  homeTeamAbbrev: string;
  awayTeamAbbrev: string;
}

const WIDTH = 300;
const HEIGHT = 300;

function NetworkGraph({
  graph,
  teamLabel,
  teamId,
}: {
  graph: AssistGraph;
  teamLabel: string;
  teamId: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const colors = getTeamColorsByTeamId(teamId);

  const maxAssists = useMemo(
    () => Math.max(1, ...graph.nodes.map((n) => n.assists)),
    [graph.nodes]
  );
  const maxLinkValue = useMemo(
    () => Math.max(1, ...graph.links.map((l) => l.value)),
    [graph.links]
  );

  useEffect(() => {
    if (!svgRef.current || graph.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const chartColor = colors.chart;

    const g = svg.append('g');

    const radiusScale = d3
      .scaleSqrt()
      .domain([0, maxAssists])
      .range([6, 24]);

    const linkScale = d3
      .scaleLinear()
      .domain([1, maxLinkValue])
      .range([1, 5]);

    const nodes: SimNode[] = graph.nodes.map((n) => ({ ...n }));
    const links: SimLink[] = graph.links.map((l) => ({
      source: l.source,
      target: l.target,
      value: l.value,
    }));

    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(80)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(WIDTH / 2, HEIGHT / 2))
      .force('collision', d3.forceCollide<SimNode>().radius((d) => radiusScale(d.assists) + 5));

    const simNodes = simulation.nodes();
    const simLinks = (simulation.force('link') as d3.ForceLink<SimNode, SimLink>).links();

    // Links — use team chart color
    const link = g
      .selectAll('.link')
      .data(simLinks)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', chartColor)
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', (d: any) => linkScale(d.value));

    // Nodes — filled with team chart color
    const node = g
      .selectAll('.node')
      .data(simNodes)
      .join('circle')
      .attr('class', 'node')
      .attr('r', (d: any) => radiusScale(d.assists))
      .attr('fill', chartColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9);

    // Assist count inside node (only if radius large enough)
    const countLabel = g
      .selectAll('.count')
      .data(simNodes.filter((d: any) => radiusScale(d.assists) >= 12))
      .join('text')
      .attr('class', 'count')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .text((d: any) => d.assists);

    // Name labels below nodes
    const label = g
      .selectAll('.label')
      .data(simNodes)
      .join('text')
      .attr('class', 'label')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => radiusScale(d.assists) + 12)
      .attr('fill', '#374151')
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .text((d: any) => d.id);

    // Run simulation synchronously
    simulation.alpha(1).restart();
    for (let i = 0; i < 150; i++) simulation.tick();
    simulation.stop();

    // Final position update
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);
    node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
    countLabel.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);

    return () => {
      simulation.stop();
    };
  }, [graph, maxAssists, maxLinkValue, colors.chart]);

  return (
    <div className="flex-1 min-w-0">
      <h3
        className="text-center text-sm font-semibold mb-1"
        style={{ color: colors.chart }}
      >
        {teamLabel}
      </h3>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        style={{ background: 'transparent' }}
      />
    </div>
  );
}

export default function AssistNetwork({
  home,
  away,
  homeTeamAbbrev,
  awayTeamAbbrev,
}: AssistNetworkProps) {
  return (
    <div>
      <div className="flex gap-4">
        <NetworkGraph
          graph={away}
          teamLabel={awayTeamAbbrev}
          teamId={away.nodes[0]?.teamId ?? 0}
        />
        <NetworkGraph
          graph={home}
          teamLabel={homeTeamAbbrev}
          teamId={home.nodes[0]?.teamId ?? 0}
        />
      </div>
      <p className="text-center text-gray-400 text-xs mt-2">
        Number in circle = total assists | Line thickness = how often that pair connected
      </p>
    </div>
  );
}
