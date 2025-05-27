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

interface MetricScore {
  metric: string;
  score: number;
  hotspot: string;
}

interface ChartDataPoint {
  metric: string;
  metricIndex: number;
  [key: string]: string | number; // For dynamic hotspot data
}

interface MetricScoreChartProps {
  height?: number;
  title?: string;
  hotspots?: string[];
  selectedHotspots?: string[];
}

export const MetricScoreChart: React.FC<MetricScoreChartProps> = ({ 
  height = 400,
  title = 'Metric-wise RP Scores across Hotspots',
  hotspots = [],
  selectedHotspots = []
}) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { chartData: contextChartData, uploadId, csvData } = useDataContext();
  
  // Colors for hotspots
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', 
    '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
  ];
  
  // Fetch data directly from backend
  const fetchBackendData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("MetricScoreChart: Fetching data from backend");
      
      const riskData = await getRiskData();
      if (riskData && riskData.length > 0) {
        console.log("MetricScoreChart: Retrieved risk data from backend:", riskData.length, "items");
        processData(riskData);
      } else {
        console.log("MetricScoreChart: No risk data available from backend");
        setError("No risk data available");
      }
    } catch (error) {
      console.error("MetricScoreChart: Error fetching data:", error);
      setError("Error fetching data from backend");
    } finally {
      setLoading(false);
    }
  }, []);

  // Process data when uploadId changes or on component mount
  useEffect(() => {
    if (uploadId > 0) {
      console.log("MetricScoreChart: Upload ID changed, fetching fresh data");
      fetchBackendData();
    }
  }, [uploadId, fetchBackendData]);

  // Process data from context or props
  useEffect(() => {
    if (contextChartData?.rawData && contextChartData.rawData.length > 0) {
      console.log("MetricScoreChart: Using data from context");
      processData(contextChartData.rawData);
    } else if (csvData && csvData.length > 0) {
      console.log("MetricScoreChart: Using CSV data");
      processData(csvData);
    } else {
      // Initial fetch if no data available
      fetchBackendData();
    }
  }, [contextChartData, csvData, fetchBackendData]);

  // Process the raw data into chart format
  const processData = (data: any[]) => {
    if (!data || data.length === 0) {
      console.log("MetricScoreChart: No data to process");
      setChartData([]);
      return;
    }

    console.log("MetricScoreChart: Processing data", data.slice(0, 2));
    
    // Extract all possible column names
    const possibleMetricNames = ['Metric', 'Metric Name', 'Risk Type', 'Risk Factor', 'Category'];
    const possibleHotspotNames = ['Hotspot', 'HS', 'Area', 'Location'];
    const possibleScoreNames = ['Risk Score', 'RP Score', 'Score', 'Total Score', 'Rating'];
    
    // Find which columns actually exist in our data
    const metricColumn = possibleMetricNames.find(name => data[0].hasOwnProperty(name)) || possibleMetricNames[0];
    const hotspotColumn = possibleHotspotNames.find(name => data[0].hasOwnProperty(name)) || possibleHotspotNames[0];
    const scoreColumn = possibleScoreNames.find(name => data[0].hasOwnProperty(name)) || possibleScoreNames[0];
    
    console.log(`Using columns: Metric=${metricColumn}, Hotspot=${hotspotColumn}, Score=${scoreColumn}`);
    
    // Extract metrics, hotspots, and scores
    const metricScores: MetricScore[] = [];
    
    data.forEach(item => {
      let metric = '';
      let hotspot = '';
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
          hotspot = item[col];
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
      
      if (metric && hotspot && score > 0) {
        metricScores.push({ metric, hotspot, score });
      }
    });
    
    console.log(`Extracted ${metricScores.length} metric scores`);
    
    // Get unique metrics and hotspots
    const uniqueMetrics = Array.from(new Set(metricScores.map(item => item.metric)));
    let uniqueHotspots = Array.from(new Set(metricScores.map(item => item.hotspot)));
    
    // Filter hotspots if provided in props
    if (selectedHotspots && selectedHotspots.length > 0) {
      uniqueHotspots = uniqueHotspots.filter(hs => selectedHotspots.includes(hs));
    } else if (hotspots && hotspots.length > 0) {
      uniqueHotspots = uniqueHotspots.filter(hs => hotspots.includes(hs));
    }
    
    console.log(`Found ${uniqueMetrics.length} metrics and ${uniqueHotspots.length} hotspots`);
    
    // Create data points for the chart
    const chartDataPoints: ChartDataPoint[] = uniqueMetrics.map((metric, index) => {
      const dataPoint: ChartDataPoint = {
        metric,
        metricIndex: index + 1
      };
      
      // Add average score for each hotspot
      uniqueHotspots.forEach(hotspot => {
        const relevantScores = metricScores.filter(
          item => item.metric === metric && item.hotspot === hotspot
        );
        
        if (relevantScores.length > 0) {
          const avgScore = relevantScores.reduce((sum, item) => sum + item.score, 0) / relevantScores.length;
          dataPoint[hotspot] = parseFloat(avgScore.toFixed(2));
        } else {
          dataPoint[hotspot] = 0;
        }
      });
      
      return dataPoint;
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
          <p className="text-gray-500 mb-2">{error || "No metric score data available"}</p>
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
  
  // Get list of hotspots actually present in the data
  const activeHotspots = Object.keys(chartData[0]).filter(
    key => key !== 'metric' && key !== 'metricIndex'
  );
  
  return (
    <div className="w-full p-4 bg-white shadow rounded-lg">
      <h3 className="text-lg font-semibold text-center mb-4">{title}</h3>
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
          <Tooltip 
            formatter={(value: number, name: string) => {
              const metricAtPosition = chartData.find(d => d[name] === value)?.metric;
              return [`${value.toFixed(2)}`, `${name} - ${metricAtPosition || ''}`];
            }}
            labelFormatter={(label) => {
              const metricName = chartData.find(d => d.metricIndex === label)?.metric;
              return `Metric: ${metricName}`;
            }}
          />
          <Legend />
          
          {/* Add a reference line for the high risk threshold */}
          <ReferenceLine y={6} stroke="red" strokeDasharray="3 3">
            <Label value="High Risk" position="right" />
          </ReferenceLine>
          
          {/* Add a reference line for the moderate risk threshold */}
          <ReferenceLine y={3} stroke="orange" strokeDasharray="3 3">
            <Label value="Moderate Risk" position="right" />
          </ReferenceLine>
          
          {/* Create lines for each hotspot */}
          {activeHotspots.map((hotspot, index) => (
            <Line
              key={`line-${hotspot}`}
              type="monotone"
              dataKey={hotspot}
              name={hotspot}
              stroke={colors[index % colors.length]}
              activeDot={{ r: 8 }}
              connectNulls={true}
            />
          ))}
          
          {/* Add scatter points to show exact values */}
          {activeHotspots.map((hotspot, index) => (
            <Scatter
              key={`scatter-${hotspot}`}
              name={`${hotspot} Points`}
              dataKey={hotspot}
              fill={colors[index % colors.length]}
              shape="circle"
              legendType="none"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Table to show metric names for the indices */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="py-2 px-4 border">Metric Index</th>
              <th className="py-2 px-4 border">Metric Name</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((data, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="py-2 px-4 border text-center">{data.metricIndex}</td>
                <td className="py-2 px-4 border">{data.metric}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MetricScoreChart;
