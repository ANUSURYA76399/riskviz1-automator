import React from 'react';
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RiskLevel {
  name: string;
  value: number;
  color: string;
}

interface RiskDistributionData {
  [key: string]: number;
}

interface RiskDistributionProps {
  data: RiskDistributionData;
  title?: string;
  height?: number;
  className?: string;
  colorMap?: { [key: string]: string };
  showAverage?: boolean;
  averageScore?: number;
  pieConfig?: {
    outerRadius?: number;
    labelFormat?: (name: string, percent: number) => string;
  };
}

export const RiskDistribution = ({
  data,
  title = 'Risk Level Distribution',
  height = 320,
  className = '',
  colorMap,
  showAverage = true,
  averageScore,
  pieConfig
}: RiskDistributionProps) => {
  // Transform data into chart format
  const chartData: RiskLevel[] = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key,
      value,
      color: colorMap?.[key] || `hsl(${Math.random() * 360}, 70%, 50%)`
    }));

  const totalCount = chartData.reduce((sum, item) => sum + item.value, 0);

  if (totalCount === 0) {
    return (
      <Card className={`p-5 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {showAverage && averageScore !== undefined && (
          <div className="bg-blue-50 px-4 py-2 rounded-md">
            <span className="text-sm text-gray-700">Avg Risk Score: </span>
            <span className="font-bold text-blue-700">
              {typeof averageScore === 'number' ? averageScore.toFixed(2) : 'N/A'}
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={pieConfig?.outerRadius || 100}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => 
              pieConfig?.labelFormat?.(name, percent) ||
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, _, item) => {
              const percent = ((value as number) / totalCount * 100).toFixed(1);
              return [`${value} (${percent}%)`, item?.payload?.name || 'Count'];
            }} 
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-4 mt-4">
        {chartData.map((item) => (
          <div key={item.name} className="text-center">
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-sm text-gray-500">{item.name}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};