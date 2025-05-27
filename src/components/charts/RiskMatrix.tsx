import React from 'react';
import { Card } from "@/components/ui/card";
import { generateRiskMatrix, getRiskLevelColor } from "@/utils/riskCalculations";

// Types for the risk matrix data and props
interface RiskDataPoint {
  likelihood: number;
  severity: number;
  score?: number;
}

interface RiskLevel {
  min: number;
  max: number;
  label: string;
  color: string;
}

interface RiskMatrixProps {
  data: RiskDataPoint[];
  className?: string;
  title?: string;
  cellSize?: { width: string; height: string };
  riskLevels?: RiskLevel[];
  likelihoodLabels?: string[];
  maxSeverity?: number;
  showLegend?: boolean;
}

export const RiskMatrix: React.FC<RiskMatrixProps> = ({
  data,
  className = '',
  title = 'Risk Matrix (Likelihood × Severity)',
  cellSize = { width: '80px', height: '80px' },
  riskLevels = [
    { min: 1, max: 3, label: 'Low', color: getRiskLevelColor(1) },
    { min: 4, max: 6, label: 'Moderate', color: getRiskLevelColor(5) },
    { min: 7, max: 9, label: 'High', color: getRiskLevelColor(8) }
  ],
  likelihoodLabels = ['Very Unlikely', 'Likely', 'Very Likely'],
  maxSeverity = 5,
  showLegend = true
}) => {
  const riskMatrix = generateRiskMatrix(data);
  
  // Add score and risk level to each cell
  const enhancedMatrix = riskMatrix.map((row, rowIndex) => {
    return row.map((cell, colIndex) => {
      const likelihood = colIndex + 1;
      const severity = maxSeverity - rowIndex;
      const score = (likelihood * severity) / (maxSeverity/9);
      const finalScore = Math.min(9, Math.max(1, Math.round(score * 10) / 10));
      
      const riskLevel = riskLevels.find(
        level => finalScore >= level.min && finalScore <= level.max
      ) || riskLevels[0];
      
      return {
        ...cell,
        score: finalScore,
        level: riskLevel.label.toLowerCase()
      };
    });
  });
  
  return (
    <Card className={`p-5 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-100"></th>
              <th className="border p-2 bg-gray-100 text-center" 
                  colSpan={likelihoodLabels.length}>Likelihood</th>
            </tr>
            <tr>
              <th className="border p-2 bg-gray-100 text-center">Severity</th>
              {likelihoodLabels.map((label, index) => (
                <th key={label} className="border p-2 bg-gray-100 text-center">
                  {index + 1}<br/>{label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {enhancedMatrix.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                <th className="border p-2 bg-gray-100 text-center">
                  {maxSeverity - rowIndex}
                </th>
                {row.map((cell, cellIndex) => {
                  const riskLevel = riskLevels.find(
                    level => cell.score >= level.min && cell.score <= level.max
                  ) || riskLevels[0];
                  
                  return (
                    <td 
                      key={`cell-${rowIndex}-${cellIndex}`}
                      className="border p-2 text-center font-medium text-white"
                      style={{ 
                        backgroundColor: riskLevel.color,
                        width: cellSize.width,
                        height: cellSize.height
                      }}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span className="text-lg font-bold">{cell.score}</span>
                        <span className="text-xs mt-1">
                          {cell.level.charAt(0).toUpperCase() + cell.level.slice(1)}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showLegend && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-8">
            {riskLevels.map(level => (
              <div key={level.label} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-sm mr-2" 
                  style={{ backgroundColor: level.color }}
                ></div>
                <span className="text-sm text-gray-600">
                  {level.label} ({level.min}-{level.max})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};