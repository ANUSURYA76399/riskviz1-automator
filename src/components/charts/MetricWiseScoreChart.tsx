import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  Scatter
} from 'recharts';
import { useDataContext } from '@/contexts/DataContext';
import { getRiskData } from '@/services/api';

interface ChartDataPoint {
  metricIndex: number;
  metric: string;
  score: number;
  [key: string]: string | number;
}

interface MetricWiseScoreChartProps {
  height?: number;
  title?: string;
  selectedHotspot?: string;
  showDataTable?: boolean;
}

export const MetricWiseScoreChart: React.FC<MetricWiseScoreChartProps> = ({
  height = 400,
  title = 'Metric-wise RP Scores',
  selectedHotspot = 'HS1',
  showDataTable = true
}) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { chartData: contextChartData, uploadId, csvData } = useDataContext();

  // Colors for data points
  const colors = {
    primary: '#FF5733',
    secondary: '#4CAF50',
    tertiary: '#3498DB'
  };

  // Fetch data directly from backend
  const fetchBackendData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("MetricWiseScoreChart: Fetching data from backend");
      
      const riskData = await getRiskData();
      if (riskData && riskData.length > 0) {
        console.log("MetricWiseScoreChart: Retrieved risk data from backend:", riskData.length, "items");
        processData(riskData, selectedHotspot);
      } else {
        console.log("MetricWiseScoreChart: No risk data available from backend");
        setError("No risk data available");
      }
    } catch (error) {
      console.error("MetricWiseScoreChart: Error fetching data:", error);
      setError("Error fetching data from backend");
    } finally {
      setLoading(false);
    }
  }, [selectedHotspot]);

  // Process data when uploadId changes or on component mount
  useEffect(() => {
    if (uploadId > 0) {
      console.log("MetricWiseScoreChart: Upload ID changed, fetching fresh data");
      fetchBackendData();
    }
  }, [uploadId, fetchBackendData]);

  // Process data from context or props
  useEffect(() => {
    if (contextChartData?.rawData && contextChartData.rawData.length > 0) {
      console.log("MetricWiseScoreChart: Using data from context");
      processData(contextChartData.rawData, selectedHotspot);
    } else if (csvData && csvData.length > 0) {
      console.log("MetricWiseScoreChart: Using CSV data");
      processData(csvData, selectedHotspot);
    } else if (!loading && chartData.length === 0) {
      // Initial fetch if no data available
      fetchBackendData();
    }
  }, [contextChartData, csvData, selectedHotspot, fetchBackendData, loading, chartData.length]);

  // Process the raw data into chart format
  const processData = (data: any[], hotspot: string) => {
    if (!data || data.length === 0) {
      console.log("MetricWiseScoreChart: No data to process");
      setChartData([]);
      return;
    }

    console.log("MetricWiseScoreChart: Processing data for hotspot:", hotspot);
    
    // Check all possible column names for our required fields
    const possibleMetricNames = ['Metric', 'Metric Name', 'Risk Type', 'Risk Factor', 'Category'];
    const possibleHotspotNames = ['Hotspot', 'HS', 'Area', 'Location'];
    const possibleScoreNames = ['Risk Score', 'RP Score', 'Score', 'Total Score', 'Rating'];
    
    // Extract metrics, hotspots, and scores
    const metricScores: { metric: string; score: number }[] = [];
    
    data.forEach(item => {
      let metric = '';
      let itemHotspot = '';
      let score = 0;
      
      // Find metric name
      for (const col of possibleMetricNames) {
        if (item[col]) {
          metric = item[col];
          break;
        }
      }
      
      // Find hotspot name
      for (const col of possibleHotspotNames) {
        if (item[col]) {
          itemHotspot = item[col];
          break;
        }
      }
      
      // Find score value
      for (const col of possibleScoreNames) {
        if (item[col]) {
          score = parseFloat(item[col]) || 0;
          break;
        }
      }
      
      // Only add data for the selected hotspot
      if (metric && itemHotspot && itemHotspot === hotspot && score > 0) {
        metricScores.push({ metric, score });
      }
    });
    
    console.log(`Extracted ${metricScores.length} metric scores for ${hotspot}`);
    
    // Group by metrics and calculate average scores
    const metricGroups = metricScores.reduce<Record<string, number[]>>((acc, { metric, score }) => {
      if (!acc[metric]) acc[metric] = [];
      acc[metric].push(score);
      return acc;
    }, {});
    
    // Create data points for the chart - one for each unique metric
    const chartDataPoints = Object.entries(metricGroups).map(([metric, scores], index) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      return {
        metricIndex: index + 1,
        metric,
        score: parseFloat(avgScore.toFixed(2))
      };
    });
    
    console.log("Processed chart data:", chartDataPoints);
    setChartData(chartDataPoints);
  };
  
  // If loading or no data, show placeholder
  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 border rounded-md">
        <p className="text-gray-500">Loading metric score data...</p>
      </div>
    );
  }
  
  if (error || chartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 border rounded-md">
        <div className="text-center">
          <p className="text-gray-500 mb-2">{error || "No metric score data available for " + selectedHotspot}</p>
          <button 
            onClick={fetchBackendData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }
  
  // Custom tooltip formatter
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const metricName = chartData.find(d => d.metricIndex === label)?.metric || '';
      const score = payload[0].value;
      
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-semibold">{metricName}</p>
          <p className="text-sm">Score: <span className="font-bold">{score}</span></p>
          <p className="text-xs text-gray-600">
            {score >= 6 ? 'High Risk' : score >= 3 ? 'Moderate Risk' : 'Low Risk'}
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="w-full p-4 bg-white shadow rounded-lg">
      <h3 className="text-lg font-semibold text-center mb-4">{`${selectedHotspot} - ${title}`}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="metricIndex" 
            label={{ value: 'Metric', position: 'insideBottom', offset: -10 }}
            tickFormatter={(value) => `${value}`}
          />
          <YAxis 
            label={{ value: 'Mean RP Score', angle: -90, position: 'insideLeft' }} 
            domain={[0, 9]}
          />
          <Tooltip content={customTooltip} />
          
          {/* Add a reference line for the high risk threshold */}
          <ReferenceLine y={6} stroke="red" strokeDasharray="3 3">
            <Label value="High Risk" position="right" />
          </ReferenceLine>
          
          {/* Add a reference line for the moderate risk threshold */}
          <ReferenceLine y={3} stroke="orange" strokeDasharray="3 3">
            <Label value="Moderate Risk" position="right" />
          </ReferenceLine>
          
          {/* Main line showing the metric scores */}
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke={colors.primary}
            strokeWidth={2}
            activeDot={{ r: 8, fill: '#FF5733', stroke: '#C0392B' }}
            dot={{ r: 6, fill: '#FF5733', stroke: '#C0392B' }}
            label={({ x, y, value }) => (
              <text x={x} y={y-15} fill="#666" textAnchor="middle" dominantBaseline="middle">
                {value}
              </text>
            )}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Table to show metric names for the indices */}
      {showDataTable && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="py-2 px-4 border">Metric Index</th>
                <th className="py-2 px-4 border">Metric Name</th>
                <th className="py-2 px-4 border">RP Score</th>
                <th className="py-2 px-4 border">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((data, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2 px-4 border text-center">{data.metricIndex}</td>
                  <td className="py-2 px-4 border">{data.metric}</td>
                  <td className="py-2 px-4 border text-center">{data.score}</td>
                  <td className="py-2 px-4 border">
                    <span 
                      className={`px-2 py-1 rounded-full text-xs text-white ${
                        data.score >= 6 ? 'bg-red-500' : 
                        data.score >= 3 ? 'bg-orange-500' : 
                        'bg-green-500'
                      }`}
                    >
                      {data.score >= 6 ? 'High Risk' : data.score >= 3 ? 'Moderate Risk' : 'Low Risk'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MetricWiseScoreChart;
