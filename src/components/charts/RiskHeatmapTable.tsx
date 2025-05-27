import React from 'react';

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RiskLevel {
  threshold: number;
  color: string;
  label: string;
}

interface RiskCell {
  value: number | null;
  phase: string;
  timeline: string;
}

interface HeatmapRow {
  hotspot: string;
  cells: { [key: string]: number | null };
}

interface RiskHeatmapTableProps {
  data: HeatmapRow[];
  title?: string;
  className?: string;
  riskLevels?: RiskLevel[];
  showHelp?: boolean;
  phaseColors?: {
    phase1: string;
    phase2: string;
  };
}

const defaultRiskLevels: RiskLevel[] = [
  { threshold: 7, color: "bg-red-200", label: "High risk (≥7.0)" },
  { threshold: 5, color: "bg-yellow-200", label: "Medium (5.0-6.9)" },
  { threshold: 3, color: "bg-green-200", label: "Low (3.0-4.9)" },
  { threshold: 0, color: "bg-blue-100", label: "Very low (<3.0)" }
];

const getRiskColor = (score: number | null, riskLevels: RiskLevel[]) => {
  if (score === null) return "";
  for (const level of riskLevels) {
    if (score >= level.threshold) return level.color;
  }
  return riskLevels[riskLevels.length - 1].color;
};

export const RiskHeatmapTable = ({
  data,
  title = "Risk Perception Scores by Phase and Hotspot",
  className = "",
  riskLevels = defaultRiskLevels,
  showHelp: initialShowHelp = false,
  phaseColors = {
    phase1: "bg-blue-50",
    phase2: "bg-red-50"
  }
}: RiskHeatmapTableProps) => {
  const [showHelp, setShowHelp] = useState(initialShowHelp);

  if (!data || data.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center p-4 text-gray-500">No data available</div>
      </Card>
    );
  }

  // Get all unique columns from the data
  const columns = Array.from(
    new Set(
      data.flatMap(row => Object.keys(row.cells))
    )
  ).sort();

  // Format column names for display
  const formatColumnName = (column: string) => {
    const parts = column.split('_');
    if (parts.length >= 2) {
      const phase = parts[0].replace('phase', 'Phase ');
      const timeline = parts[1].toUpperCase();
      return `${phase} (${timeline})`;
    }
    return column;
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setShowHelp(!showHelp)}
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Color intensity indicates risk level:<br/>
                {riskLevels.map((level, index) => (
                  <span key={index} className={level.color.replace('bg-', 'text-').replace('-200', '-600').replace('-100', '-600')}>
                    {level.threshold > 0 ? `≥${level.threshold}.0` : '<3.0'}: {level.label}<br/>
                  </span>
                ))}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {showHelp && (
        <div className="mb-4 bg-blue-50 p-3 rounded-md text-sm">
          <p>The heatmap table shows risk perception scores across phases and hotspots.</p>
          <div className="flex gap-4 mt-2">
            {riskLevels.map((level, index) => (
              <div key={index} className="flex items-center gap-1">
                <div className={`w-3 h-3 ${level.color} rounded`}></div>
                <span>{level.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-100">Hotspot</th>
              {columns.map((column, index) => (
                <th 
                  key={index} 
                  className={`border p-2 ${column.startsWith('phase1') ? phaseColors.phase1 : phaseColors.phase2}`}
                >
                  {formatColumnName(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td className="border p-2 font-medium">{row.hotspot}</td>
                {columns.map((column, colIdx) => {
                  const value = row.cells[column];
                  return (
                    <td 
                      key={colIdx} 
                      className={`border p-2 text-center ${getRiskColor(value, riskLevels)}`}
                    >
                      {value !== null ? value.toFixed(1) : 'N/A'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};