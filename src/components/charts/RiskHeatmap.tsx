import { useState } from 'react';
import { getRiskLevel, getRiskLevelColor } from "@/utils/riskCalculations";
import { getScoreColor, getTextColor } from "@/utils/chartColors";

interface HeatmapCell {
  value: number;
  label?: string;
}

interface HeatmapRow {
  rowLabel: string;
  cells: HeatmapCell[];
}

interface RiskHeatmapProps {
  data: HeatmapRow[];
  columnLabels: string[];
  phases?: string[];
  defaultPhase?: string;
  onPhaseChange?: (phase: string) => void;
  className?: string;
  colorConfig?: {
    getBackgroundColor?: (value: number) => string;
    getTextColor?: (backgroundColor: string) => string;
  };
  legendConfig?: {
    values: number[];
    labels?: string[];
    className?: string;
  };
}

export const RiskHeatmap = ({
  data,
  columnLabels,
  phases = ['Phase 1', 'Phase 2', 'Phase 3'],
  defaultPhase = 'Phase 3',
  onPhaseChange,
  className = '',
  colorConfig = {
    getBackgroundColor: getScoreColor,
    getTextColor: getTextColor
  },
  legendConfig = {
    values: [1, 4, 7],
    labels: ['Low (1-3)', 'Moderate (4-6)', 'High (7-9)'],
    className: 'flex justify-center mt-6'
  }
}: RiskHeatmapProps) => {
  const [phase, setPhase] = useState<string>(defaultPhase);
  
  const handlePhaseChange = (newPhase: string) => {
    setPhase(newPhase);
    onPhaseChange?.(newPhase);
  };

  if (!data || data.length === 0 || !columnLabels || columnLabels.length === 0) {
    return (
      <div className={className}>
        <div className="text-center p-4 text-gray-500">No data available</div>
      </div>
    );
  }
  
  return (
    <div className={className}>
      {phases.length > 0 && (
        <div className="flex justify-end mb-4">
          <select 
            className="rounded-md border border-gray-300 p-2 text-sm"
            value={phase}
            onChange={(e) => handlePhaseChange(e.target.value)}
          >
            {phases.map(phaseOption => (
              <option key={phaseOption}>{phaseOption}</option>
            ))}
          </select>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="bg-white px-3 py-2 text-sm font-medium text-gray-700 text-left"></th>
              {columnLabels.map((label, index) => (
                <th 
                  key={index}
                  className="bg-gray-100 border-b px-3 py-2 text-sm font-medium text-gray-700 text-left"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th className="bg-gray-100 border-r px-3 py-2 text-sm font-medium text-gray-700 text-left">
                  {row.rowLabel}
                </th>
                {row.cells.map((cell, cellIndex) => {
                  const backgroundColor = colorConfig.getBackgroundColor?.(cell.value) || '#f0f0f0';
                  return (
                    <td 
                      key={cellIndex}
                      className="px-3 py-2 text-sm text-center font-medium"
                      style={{ 
                        backgroundColor,
                        color: colorConfig.getTextColor?.(backgroundColor) || '#000000'
                      }}
                    >
                      {cell.label || cell.value.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {legendConfig && (
        <div className={legendConfig.className}>
          <div className="flex items-center space-x-8">
            {legendConfig.values.map((value, index) => (
              <div key={value} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-sm mr-2" 
                  style={{ backgroundColor: colorConfig.getBackgroundColor?.(value) || '#f0f0f0' }}
                />
                <span className="text-sm text-gray-600">
                  {legendConfig.labels?.[index] || `Value: ${value}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};