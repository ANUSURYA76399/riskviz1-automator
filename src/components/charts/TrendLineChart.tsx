import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { Card } from '@/components/ui/card';
import { useDataContext } from '@/contexts/DataContext';
import { getScoreColor } from '@/utils/chartColors';

// Type definitions
type MetricItem = {
  metric: string;
  score: number;
  risk: string;
};

type TrendLineChartProps = {
  customData?: any[];
  metricView?: boolean;
  phaseView?: boolean;
  selectedHotspots?: string[];
  selectedRespondentGroup?: string;
  selectedPhase?: number;
  selectedMetrics?: string[];
  selectedAO?: string;
};

// Sample data for fallback
const defaultMetricWiseData: { [key: string]: MetricItem[] } = {
  "HS1": [
    { metric: "1", score: 3.6, risk: "Moderate" },
    { metric: "2", score: 6.0, risk: "High" },
    { metric: "3", score: 4.5, risk: "Moderate" },
    { metric: "4", score: 5.75, risk: "Moderate" },
  ],
  "HS2": [
    { metric: "1", score: 5.9, risk: "High" },
    { metric: "2", score: 5.79, risk: "Moderate" },
    { metric: "3", score: 5.4, risk: "Moderate" },
    { metric: "4", score: 4.6, risk: "Moderate" },
  ],
  "HS3": [
    { metric: "1", score: 4.8, risk: "Moderate" },
    { metric: "2", score: 5.2, risk: "Moderate" },
    { metric: "3", score: 6.1, risk: "High" },
    { metric: "4", score: 4.9, risk: "Moderate" },
  ],
  "HS4": [
    { metric: "1", score: 5.3, risk: "Moderate" },
    { metric: "2", score: 4.7, risk: "Moderate" },
    { metric: "3", score: 5.5, risk: "Moderate" },
    { metric: "4", score: 6.2, risk: "High" },
  ],
  "HS5": [
    { metric: "1", score: 4.5, risk: "Moderate" },
    { metric: "2", score: 5.1, risk: "Moderate" },
    { metric: "3", score: 4.9, risk: "Moderate" },
    { metric: "4", score: 5.8, risk: "Moderate" },
  ]
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-md shadow-md">
        <p className="font-semibold">{`Metric ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-2">
            <span style={{ color: entry.color }}>{entry.name ?? 'N/A'}: </span>
            <span className="font-bold">{entry.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  customData,
  metricView = true,
  phaseView = false,
  selectedHotspots = ["HS1"],
  selectedRespondentGroup,
  selectedPhase,
  selectedMetrics,
  selectedAO
}) => {
  // Connect to the data context
  const { chartData } = useDataContext();
  
  // State for chart data
  const [chartDataState, setChartDataState] = useState<any[]>([]);
  
  // Process data based on provided options
  useEffect(() => {
    console.log("TrendLineChart: Processing data with options:", { 
      customData: !!customData, 
      metricView, 
      phaseView,
      selectedHotspots,
      selectedRespondentGroup,
      selectedPhase,
      selectedMetrics: selectedMetrics?.length,
      selectedAO
    });
    
    // If custom data is provided, use it
    if (customData && customData.length > 0) {
      console.log("TrendLineChart: Using custom data", customData.length);
      setChartDataState(customData);
      return;
    }
    
    // If data is available from context, use it
    if (chartData && chartData.metricWiseScores && chartData.metricWiseScores.length > 0) {
      console.log("TrendLineChart: Using context data", chartData.metricWiseScores.length);
      setChartDataState(chartData.metricWiseScores);
      return;
    }
    
    // Fall back to default data
    console.log("TrendLineChart: Using default data");
    
    // Transform the default data based on the selected view
    if (metricView) {
      // Create metric-wise comparison data
      const transformedData = Object.entries(defaultMetricWiseData)
        .filter(([hotspot]) => selectedHotspots.includes(hotspot))
        .flatMap(([hotspot, metrics]) => {
          return metrics.map(item => ({
            metric: item.metric,
            [hotspot]: item.score,
            risk: item.risk
          }));
        })
        .reduce((acc: any[], curr) => {
          // Group by metric
          const existing = acc.find(item => item.metric === curr.metric);
          if (existing) {
            // Merge with existing metric entry
            Object.entries(curr).forEach(([key, value]) => {
              if (key !== 'metric' && key !== 'risk') {
                existing[key] = value;
              }
            });
            return acc;
          } else {
            // Add new metric entry
            return [...acc, curr];
          }
        }, []);
      
      setChartDataState(transformedData);
    } else if (phaseView) {
      // Handle phase view if needed
      // ...
    } else {
      // Default handling
      const firstHotspot = selectedHotspots[0] || "HS1";
      setChartDataState((defaultMetricWiseData as { [key: string]: MetricItem[] })[firstHotspot] || []);
    }
  }, [
    customData, 
    chartData, 
    metricView, 
    phaseView, 
    selectedHotspots, 
    selectedRespondentGroup, 
    selectedPhase, 
    selectedMetrics, 
    selectedAO
  ]);

  // Lines to render based on selected hotspots
  const hotspotLines = useMemo(() => {
    if (!metricView || !selectedHotspots || selectedHotspots.length === 0) {
      return [{ hotspot: "HS1", color: "#3b82f6" }];
    }
    
    const colors = ["#3b82f6", "#ef4444", "#84cc16", "#8b5cf6", "#06b6d4"];
    
    return selectedHotspots.map((hotspot, index) => ({
      hotspot,
      color: colors[index % colors.length]
    }));
  }, [metricView, selectedHotspots]);

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">
        {metricView 
          ? "Metric-wise RP Scores Across Hotspots" 
          : phaseView 
            ? "RP Scores Across Phases" 
            : "Risk Perception Trends"}
      </h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartDataState}
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="metric" 
              label={{ 
                value: 'Metric', 
                position: 'insideBottomRight', 
                offset: -10 
              }} 
            />
            <YAxis 
              domain={[0, 10]} 
              label={{ 
                value: 'RP Score', 
                angle: -90, 
                position: 'insideLeft' 
              }} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {hotspotLines.map(line => (
              <Line
                key={line.hotspot}
                type="monotone"
                dataKey={line.hotspot}
                name={line.hotspot}
                stroke={line.color}
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>This chart displays risk perception scores across different metrics for the selected hotspots.</p>
        <p>Higher scores indicate higher perceived risk.</p>
      </div>
    </Card>
  );
};

export default TrendLineChart;
