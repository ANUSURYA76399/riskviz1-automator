import { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ZAxis, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { useDataContext } from '@/contexts/DataContext';
import { getDataPoints, getRiskData } from '@/services/api';

// Empty data structure to use when no data is available
const emptyData: DataPoint[] = [
  { x: 0, y: 0, z: 0, name: 'No Data Available' },
];

// Empty metrics group for when no data is available
const emptyMetricsData: MetricGroup[] = [
  { name: 'No Data', data: emptyData },
];

// Colors for each metric
const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

// Types for the scatter plot data and props
interface DataPoint {
  x: number;
  y: number;
  z: number;
  name: string;
}

interface MetricGroup {
  name: string;
  data: DataPoint[];
}

// Custom tooltip component
const CustomTooltip = ({ 
  active, 
  payload,
  style = { backgroundColor: '#FF69B4', textColor: '#FFFFFF' } 
}: TooltipProps<ValueType, NameType> & { style?: { backgroundColor?: string; textColor?: string } }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="p-3 rounded-md shadow-lg" style={{
        backgroundColor: style.backgroundColor,
        color: style.textColor
      }}>
        <p className="font-bold">{data.name}</p>
        <p>X: {data.x}</p>
        <p>Y: {data.y}</p>
        <p>Z: {data.z}</p>
      </div>
    );
  }

  return null;
};

interface ScatterPlotProps {
  customData?: { name: string; data: any[] }[] | null;
  data?: MetricGroup[];
  height?: number;
  colors?: string[];
  axisConfig?: {
    x?: { domain?: [number, number]; tickCount?: number; label?: string };
    y?: { domain?: [number, number]; tickCount?: number; label?: string };
    z?: { range?: [number, number]; label?: string };
  };
  tooltipStyle?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

export const ScatterPlot = ({ customData = null }: ScatterPlotProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [metricsData, setMetricsData] = useState<MetricGroup[]>(emptyMetricsData);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { chartData: contextChartData, uploadId, csvData, forceRefreshData } = useDataContext();
  
  // Function to fetch data directly from the backend
  const fetchBackendData = useCallback(async () => {
    try {
      setLoading(true);
      console.log("ScatterPlot: Fetching fresh data from backend");
      
      // Try to get risk data first
      const riskData = await getRiskData();
      if (riskData && riskData.length > 0) {
        console.log("ScatterPlot: Retrieved risk data from backend:", riskData.length, "items");
        const processedData = processRawCsvData(riskData);
        if (processedData.length > 0) {
          setMetricsData(processedData);
          setLastUpdated(new Date());
          return;
        }
      }
      
      // If no risk data, try to get point data
      const pointData = await getDataPoints();
      if (pointData && pointData.length > 0) {
        console.log("ScatterPlot: Retrieved point data from backend:", pointData.length, "items");
        
        // Format the points data for scatter plot
        const formattedData = [{
          name: 'Data Points',
          data: pointData.map((point: any) => ({
            x: point.x || 0,
            y: point.y || 0,
            z: point.x * point.y || 0, // Calculate z as product if not provided
            name: `Point (${point.x}, ${point.y})`
          })) as DataPoint[]
        }];
        
        setMetricsData(formattedData);
        setLastUpdated(new Date());
      } else {
        console.log("ScatterPlot: No data available from backend");
      }
    } catch (error) {
      console.error("ScatterPlot: Error fetching data from backend:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Reset the chart when uploadId changes (meaning new data was uploaded)
    if (uploadId > 0) {
      console.log("ScatterPlot: Detected uploadId change:", uploadId);
      
      // First, try direct fetch from backend for the freshest data
      fetchBackendData().catch(console.error);
      
      // Also check if context data is updated
      if (contextChartData?.scatterPlotData && 
          Array.isArray(contextChartData.scatterPlotData) && 
          contextChartData.scatterPlotData.length > 0) {
        console.log("ScatterPlot: Also found updated context data");
        setMetricsData(contextChartData.scatterPlotData as MetricGroup[]);
        setLastUpdated(new Date());
      }
    }
  }, [uploadId, fetchBackendData, contextChartData]);
  
  useEffect(() => {
    // This handles the data flow from props and context
    // First, check if customData is provided directly to this component
    if (customData && Array.isArray(customData) && customData.length > 0) {
      console.log("ScatterPlot: Received custom data:", customData.length, "groups");
      
      // Check each group's data structure
      let isValidData = true;
      customData.forEach((group, idx) => {
        if (!group.data || !Array.isArray(group.data)) {
          console.error(`Invalid data structure in group ${idx}:`, group);
          isValidData = false;
        } else if (group.data.length > 0) {
          // Check a sample point
          const point = group.data[0];
          if (typeof point.x === 'undefined' || 
              typeof point.y === 'undefined' || 
              typeof point.z === 'undefined') {
            console.error(`Invalid point structure in group ${idx}:`, point);
            isValidData = false;  
          }
        }
      });
      
      if (isValidData) {
        setMetricsData(customData as MetricGroup[]);
        setLastUpdated(new Date());
      } else {
        console.error("Invalid data structure in custom data");
        
        // Fall back to context data or process raw CSV data
        if (contextChartData?.scatterPlotData && 
            Array.isArray(contextChartData.scatterPlotData) && 
            contextChartData.scatterPlotData.length > 0) {
          console.log("Using context chart data instead");
          setMetricsData(contextChartData.scatterPlotData as MetricGroup[]);
          setLastUpdated(new Date());
        } else if (csvData && csvData.length > 0) {
          console.log("Processing raw CSV data for ScatterPlot");
          const processedData = processRawCsvData(csvData);
          if (processedData.length > 0) {
            console.log("Successfully processed CSV data for ScatterPlot");
            setMetricsData(processedData);
            setLastUpdated(new Date());
          }
        }
      }
    } else {
      // If no direct customData, check for context data
      if (contextChartData?.scatterPlotData && 
          Array.isArray(contextChartData.scatterPlotData) && 
          contextChartData.scatterPlotData.length > 0) {
        console.log("Updating from context data");
        console.log("ScatterPlot data from context:", contextChartData.scatterPlotData);
        setMetricsData(contextChartData.scatterPlotData as MetricGroup[]);
        setLastUpdated(new Date());
      } else if (csvData && csvData.length > 0) {
        console.log("Processing raw CSV data for ScatterPlot");
        const processedData = processRawCsvData(csvData);
        if (processedData.length > 0) {
          console.log("Successfully processed CSV data for ScatterPlot");
          setMetricsData(processedData);
          setLastUpdated(new Date());
        }
      }
    }
  }, [customData, contextChartData, csvData]);
  
  // Add effect to monitor metricsData changes
  useEffect(() => {
    console.log("ScatterPlot received metrics data:", metricsData);
    if (metricsData.length === 0) {
      console.log("No metrics data available for ScatterPlot");
    } else {
      console.log("First metrics group:", metricsData[0]);
      if (metricsData[0].data) {
        console.log("First data point:", metricsData[0].data[0]);
      }
    }
  }, [metricsData]);

  // Function to process raw CSV data for scatter plot
  const processRawCsvData = (data: any[]): { name: string; data: DataPoint[] }[] => {
    console.log("Processing raw CSV data in ScatterPlot:", data.length, "rows");
    
    if (!data || data.length === 0) {
      console.log("No data to process in processRawCsvData");
      return [];
    }
    
    // Log first few data items to see their structure
    console.log("Sample data items:", data.slice(0, 2));
    
    // Check if data has x,y coordinates directly (from points table)
    if (data[0].hasOwnProperty('x') && data[0].hasOwnProperty('y')) {
      console.log("Data appears to be pre-formatted with x,y coordinates");
      
      const points = data.map((point: any) => ({
        x: parseFloat(point.x) || 0,
        y: parseFloat(point.y) || 0,
        z: parseFloat(point.z) || (point.x * point.y) || 0, // Calculate z as product if not provided
        name: point.name || `Point (${point.x}, ${point.y})`
      })).filter(p => p.x > 0 || p.y > 0);
      
      if (points.length > 0) {
        return [{
          name: 'Data Points',
          data: points
        }];
      }
    }
    
    // Otherwise process as risk data with metrics
    
    // Check all possible column names for our required fields
    const possibleMetricNames = ['Metric', 'Metric Name', 'Risk Type', 'Risk Factor', 'Category'];
    const possibleLikelihoodNames = ['Likelihood', 'Probability', 'Frequency', 'Occurrence'];
    const possibleSeverityNames = ['Severity', 'Impact', 'Consequence', 'Effect'];
    const possibleScoreNames = ['Risk Score', 'RP Score', 'Score', 'Total Score', 'Rating'];
    
    // Find which columns actually exist in our data
    const metricColumn = possibleMetricNames.find(name => data[0].hasOwnProperty(name)) || possibleMetricNames[0];
    const likelihoodColumn = possibleLikelihoodNames.find(name => data[0].hasOwnProperty(name)) || possibleLikelihoodNames[0];
    const severityColumn = possibleSeverityNames.find(name => data[0].hasOwnProperty(name)) || possibleSeverityNames[0];
    const scoreColumn = possibleScoreNames.find(name => data[0].hasOwnProperty(name)) || possibleScoreNames[0];
    
    console.log(`Using columns: Metric=${metricColumn}, Likelihood=${likelihoodColumn}, Severity=${severityColumn}, Score=${scoreColumn}`);
    
    // Get unique metrics
    const metricValues = Array.from(new Set(data.map(item => {
      // Try each possible metric column name
      for (const colName of possibleMetricNames) {
        if (item[colName]) return item[colName];
      }
      return '';
    }))).filter(Boolean);
    
    console.log(`Found ${metricValues.length} unique metrics:`, metricValues);
    
    // If no metrics found, create a default grouping
    if (metricValues.length === 0) {
      console.log("No metrics found, creating a default group");
      
      const points = data.map(item => {
        let x = 0, y = 0, z = 0;
        
        // Try to find values using all possible column names
        for (const col of possibleLikelihoodNames) if (item[col]) x = parseFloat(item[col]) || 0;
        for (const col of possibleSeverityNames) if (item[col]) y = parseFloat(item[col]) || 0;
        for (const col of possibleScoreNames) if (item[col]) z = parseFloat(item[col]) || 0;
        
        // If still no data, try generic numeric columns
        if (x === 0 && y === 0) {
          // Look for any numeric columns
          Object.entries(item).forEach(([key, value]) => {
            const numValue = parseFloat(value as string);
            if (!isNaN(numValue)) {
              if (x === 0) x = numValue;
              else if (y === 0) y = numValue;
              else if (z === 0) z = numValue;
            }
          });
        }
        
        // If we have x,y but no z, calculate z
        if (x > 0 && y > 0 && z === 0) z = x * y;
        
        return {
          x, y, z,
          name: item['Name'] || item['Description'] || item['Title'] || 'Data Point'
        };
      }).filter(point => point.x > 0 || point.y > 0);
      
      if (points.length > 0) {
        return [{
          name: 'All Data Points',
          data: points
        }];
      }
      
      return [];
    }
    
    // Group data by metrics
    return metricValues.map((metric, index) => {
      // Filter data for this metric, checking all possible column names
      const metricData = data.filter(item => {
        for (const colName of possibleMetricNames) {
          if (item[colName] === metric) return true;
        }
        return false;
      });
      
      const points = metricData.map(item => {
        let likelihood = 0, severity = 0, score = 0;
        
        // Try all possible column names for each value
        for (const col of possibleLikelihoodNames) if (item[col]) likelihood = parseFloat(item[col]) || 0;
        for (const col of possibleSeverityNames) if (item[col]) severity = parseFloat(item[col]) || 0;
        for (const col of possibleScoreNames) if (item[col]) score = parseFloat(item[col]) || 0;
        
        // Calculate score if missing
        if (likelihood > 0 && severity > 0 && score === 0) {
          score = likelihood * severity;
        }
        
        return {
          x: likelihood,
          y: severity,
          z: score,
          name: metric
        };
      }).filter(point => 
        (point.x > 0 || point.y > 0 || point.z > 0) // Skip points with all zero values
      );
      
      return {
        name: `${metric}`,
        data: points
      };
    }).filter(group => group.data.length > 0); // Only include groups with data
  };
  
  console.log("ScatterPlot rendering with data:", 
    metricsData ? `${metricsData.length} metric groups` : "No data");
  
  // Log point details for deeper debugging
  if (metricsData && metricsData.length > 0) {
    metricsData.forEach((group, index) => {
      console.log(`Metric group ${index} (${group.name}):`, 
        group.data?.length > 0 
          ? `${group.data.length} points` 
          : "No points");
      
      if (group.data?.length > 0) {
        console.log(`Sample point from ${group.name}:`, group.data[0]);
      }
    });
  }
  
  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };
  
  // Initial data fetch on component mount
  useEffect(() => {
    console.log("ScatterPlot: Initial component mount");
    if (!customData && (!metricsData || metricsData === emptyMetricsData)) {
      console.log("ScatterPlot: Attempting initial data fetch");
      fetchBackendData().catch(error => {
        console.error("ScatterPlot: Initial data fetch failed:", error);
      });
    }
  }, []);

  // Check if we have valid data to render
  const hasValidData = metricsData && metricsData.some(metric => 
    metric.data && metric.data.length > 0 && 
    // Make sure we have at least one point with non-zero values
    metric.data.some(point => point.x > 0 || point.y > 0 || point.z > 0));
  
  if (!hasValidData) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 border rounded-md">
        <p className="text-gray-500">No metric data available for scatter plot visualization</p>
        {loading && <p className="text-blue-500 mt-2">Loading data...</p>}
        <button 
          onClick={() => fetchBackendData()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Refresh Data
        </button>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart
        margin={{
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        }}
      >
        <CartesianGrid />
        <XAxis 
          type="number" 
          dataKey="x" 
          name="Likelihood" 
          domain={[0, 4]} 
          tickCount={4}
          label={{ value: 'Likelihood', position: 'insideBottom', offset: -5 }} 
        />
        <YAxis 
          type="number" 
          dataKey="y" 
          name="Severity" 
          domain={[0, 4]} 
          tickCount={4}
          label={{ value: 'Severity', position: 'insideLeft', angle: -90, offset: -5 }}
        />
        <ZAxis type="number" dataKey="z" range={[60, 200]} name="Risk Score" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        
        {metricsData.map((metric, index) => (
          <Scatter 
            key={`${metric.name}-${index}-${uploadId}`}
            name={metric.name} 
            data={metric.data} 
            fill={colors[index % colors.length]} 
            shape="circle"
            onMouseEnter={(data, index) => handleMouseEnter(data, index)}
            onMouseLeave={handleMouseLeave}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
};