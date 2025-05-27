import { useState, useEffect } from 'react';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataPoint {
  name: string;
  riskScore: number;
  disruptionPercentage: number;
}

interface CombinedChartProps {
  data?: DataPoint[];
  height?: number;
  barColor?: string;
  lineColor?: string;
}

export const CombinedChart = ({
  data = [],
  height = 400,
  barColor = '#3b82f6',
  lineColor = '#8B5CF6'
}: CombinedChartProps) => {
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  
  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      // Validate data structure
      const isValidData = data.every(item =>
        item &&
        typeof item.name === 'string' &&
        typeof item.riskScore === 'number' &&
        typeof item.disruptionPercentage === 'number'
      );

      if (isValidData) {
        setChartData(data);
      } else {
        console.error('Invalid data structure provided to CombinedChart');
        setChartData([]);
      }
    } else {
      setChartData([]);
    }
  }, [data]);
  
  if (chartData.length === 0) {
    return <div>No data available</div>;
  }
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 40,
          left: 20,
          bottom: 70,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45} 
          textAnchor="end" 
          height={80} 
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          yAxisId="left"
          orientation="left"
          label={{ value: 'Risk Perception Score', angle: -90, position: 'insideLeft' }} 
          domain={[0, 'auto']}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          label={{ value: 'Disruption Percentage', angle: 90, position: 'insideRight' }} 
          domain={[0, 'auto']}
        />
        <Tooltip 
          formatter={(value: number, name: string) => {
            if (name === 'Risk Score') return [value.toFixed(2), name];
            if (name === 'Disruption %') return [`${value.toFixed(2)}%`, name];
            return [value, name];
          }}
        />
        <Legend wrapperStyle={{ paddingTop: 10 }} />
        <Bar 
          yAxisId="left"
          dataKey="riskScore" 
          name="Risk Score" 
          fill={barColor}
          radius={[4, 4, 0, 0]}
          maxBarSize={50}
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="disruptionPercentage" 
          name="Disruption %" 
          stroke={lineColor}
          strokeWidth={3}
          dot={{ stroke: lineColor, strokeWidth: 2, r: 4 }}
          activeDot={{ stroke: lineColor, strokeWidth: 2, r: 6 }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};