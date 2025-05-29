import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

interface DotPlotChartProps {
  data: { metric: string; score: number }[];
}

const DotPlotChart: React.FC<DotPlotChartProps> = ({ data }) => {
  return (
    <Card className="w-full h-[400px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="category" 
            dataKey="metric" 
            name="Metric" 
            label={{ value: 'Metric', position: 'insideBottom', offset: -10 }}
            minTickGap={0}
            domain={[0, 'auto']}
          />
          <YAxis 
            type="number" 
            dataKey="score" 
            name="Mean RP score" 
            label={{ value: 'Mean RP score', angle: -90, position: 'insideLeft', offset: 10 }}
            domain={[1, 'auto']}
            allowDecimals={true}
          />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="RP Score" data={data} fill="#2563eb" />
        </ScatterChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default DotPlotChart;