
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { LOCATIONS } from '../types';

interface WorldMapProps {
  currentLocationId: string;
  onNavigate: (locationId: string) => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ currentLocationId, onNavigate }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 400;
    const height = 300;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const nodes = Object.values(LOCATIONS).map(loc => ({ ...loc }));
    const links: any[] = [];
    
    nodes.forEach(node => {
      node.connections.forEach(connId => {
        // Only add one direction for simplicity in force layout
        if (nodes.find(n => n.id === connId)) {
          links.push({ source: node.id, target: connId });
        }
      });
    });

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .on('click', (event, d: any) => onNavigate(d.id));

    node.append('circle')
      .attr('r', 12)
      .attr('fill', (d: any) => d.id === currentLocationId ? '#60a5fa' : '#1e293b')
      .attr('stroke', (d: any) => d.id === currentLocationId ? '#fff' : '#475569')
      .attr('stroke-width', 2)
      .attr('class', 'transition-colors duration-300');

    node.append('text')
      .text((d: any) => d.name)
      .attr('x', 15)
      .attr('y', 5)
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [currentLocationId, onNavigate]);

  return (
    <div className="glass-effect p-4 rounded-xl ice-glow overflow-hidden">
      <h3 className="text-sm font-bold uppercase tracking-widest text-blue-300 mb-2">Ecosystem Web</h3>
      <svg ref={svgRef} width="100%" height="250" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" />
      <p className="text-[10px] text-slate-500 mt-2 italic text-center">Click a node to travel to nearby regions.</p>
    </div>
  );
};

export default WorldMap;
