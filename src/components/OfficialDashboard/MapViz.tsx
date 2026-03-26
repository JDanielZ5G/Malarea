import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { PatientReport } from "../../types";

interface MapVizProps {
  reports: PatientReport[];
}

export default function MapViz({ reports }: MapVizProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || reports.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    // Simple scatter plot as a map proxy for the prototype
    // In a real app, this would be a GeoJSON map of Kenya/Districts
    const xScale = d3.scaleLinear()
      .domain([d3.min(reports, d => d.location.lng) || 0, d3.max(reports, d => d.location.lng) || 1])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([d3.min(reports, d => d.location.lat) || 0, d3.max(reports, d => d.location.lat) || 1])
      .range([height - margin.bottom, margin.top]);

    // Draw grid lines
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5).tickSize(-height + margin.top + margin.bottom).tickFormat(() => ""))
      .style("stroke", "#e2e8f0")
      .style("stroke-dasharray", "2,2");

    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-width + margin.left + margin.right).tickFormat(() => ""))
      .style("stroke", "#e2e8f0")
      .style("stroke-dasharray", "2,2");

    // Plot points
    const points = svg.selectAll(".point")
      .data(reports)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", d => xScale(d.location.lng))
      .attr("cy", d => yScale(d.location.lat))
      .attr("r", 6)
      .attr("fill", d => {
        if (d.aiDiagnosis?.urgency === "critical") return "#ef4444";
        if (d.aiDiagnosis?.urgency === "high") return "#f59e0b";
        return "#10b981";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).transition().attr("r", 10);
      })
      .on("mouseout", function(event, d) {
        d3.select(this).transition().attr("r", 6);
      });

    // Add labels for districts
    const districts = Array.from(new Set(reports.map(r => r.location.district)));
    districts.forEach(district => {
      const districtReports = reports.filter(r => r.location.district === district);
      const avgLng = d3.mean(districtReports, d => d.location.lng) || 0;
      const avgLat = d3.mean(districtReports, d => d.location.lat) || 0;

      svg.append("text")
        .attr("x", xScale(avgLng))
        .attr("y", yScale(avgLat) - 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .attr("fill", "#64748b")
        .text(district);
    });

  }, [reports]);

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Geospatial Distribution</h3>
        <div className="flex gap-3">
          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
            <div className="w-2 h-2 rounded-full bg-red-500" /> Critical
          </div>
          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Stable
          </div>
        </div>
      </div>
      <svg ref={svgRef} viewBox="0 0 600 400" className="w-full h-auto" />
    </div>
  );
}
