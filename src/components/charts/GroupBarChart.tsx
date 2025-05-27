import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDataContext } from '@/contexts/DataContext';

// Empty data structure for when no data is available
const emptyData = [
  { name: 'No Data Available', phase1: 0, phase2: 0, phase3: 0 }
];

export const GroupBarChart = ({ customData = null }: { customData?: any[] | null }) => {
  const [chartData, setChartData] = useState<any[]>(emptyData);
  const { chartData: contextChartData, uploadId, csvData } = useDataContext();
  
  useEffect(() => {
    // First check if customData is provided directly to this component
    if (customData && Array.isArray(customData) && customData.length > 0) {
      console.log("GroupBarChart received new custom data:", customData);
      
      // Validate the structure of the first item
      const firstItem = customData[0];
      if (firstItem && 
          typeof firstItem.name === 'string' && 
          typeof firstItem.phase1 !== 'undefined' && 
          typeof firstItem.phase2 !== 'undefined' && 
          typeof firstItem.phase3 !== 'undefined') {
        
        console.log("Custom data is valid, updating chart");
        setChartData(customData);
      } else {
        console.error("Invalid custom data structure:", firstItem);
        
        // Check if we have context chart data from the DataContext
        if (contextChartData?.groupBarChartData && 
            Array.isArray(contextChartData.groupBarChartData) && 
            contextChartData.groupBarChartData.length > 0) {
          console.log("Using context chart data instead");
          setChartData(contextChartData.groupBarChartData);
        } else {
          // Directly process raw CSV data if available
          if (csvData && csvData.length > 0) {
            console.log("Processing raw CSV data for GroupBarChart");
            const processedData = processRawCsvData(csvData);
            if (processedData.length > 0) {
              console.log("Successfully processed CSV data for GroupBarChart:", processedData);
              setChartData(processedData);
            } else {
              console.log("No valid data available");
              setChartData(emptyData);
            }
          } else {
            console.log("No data available");
            setChartData(emptyData);
          }
        }
      }
    } else {
      // If no direct customData, check for context data
      if (contextChartData?.groupBarChartData && 
          Array.isArray(contextChartData.groupBarChartData) && 
          contextChartData.groupBarChartData.length > 0) {
        console.log("Using context chart data");
        setChartData(contextChartData.groupBarChartData);
      } else {
        // Directly process raw CSV data if available
        if (csvData && csvData.length > 0) {
          console.log("Processing raw CSV data for GroupBarChart");
          const processedData = processRawCsvData(csvData);
          if (processedData.length > 0) {
            console.log("Successfully processed CSV data for GroupBarChart:", processedData);
            setChartData(processedData);
          } else {
            console.log("No custom data provided");
            setChartData(emptyData);
          }
        } else {
          console.log("No data available");
          setChartData(emptyData);
        }
      }
    }
  }, [customData, contextChartData, csvData, uploadId]);
  
  // Function to process raw CSV data directly for the bar chart
  const processRawCsvData = (data: any[]) => {
    if (!data || data.length === 0) return [];
    
    // Group data by respondent groups
    const groups = new Map();
    
    data.forEach(item => {
      const group = item['Respondent Group'] || item['Respondent Type'] || item['RespondentGroup'] || 'Unknown';
      const phase = parseInt(item['Phase'] || '1', 10);
      const score = parseFloat(item['RP Score'] || item['Score'] || item['Risk Score'] || '0');
      
      if (!isNaN(score)) {
        if (!groups.has(group)) {
          groups.set(group, {
            name: group,
            phase1Scores: [],
            phase2Scores: [],
            phase3Scores: []
          });
        }
        
        const groupData = groups.get(group);
        
        if (phase === 1) {
          groupData.phase1Scores.push(score);
        } else if (phase === 2) {
          groupData.phase2Scores.push(score);
        } else if (phase === 3) {
          groupData.phase3Scores.push(score);
        }
      }
    });
    
    // Calculate averages for each phase
    return Array.from(groups.values()).map(group => {
      const phase1 = group.phase1Scores.length > 0
        ? group.phase1Scores.reduce((sum: number, score: number) => sum + score, 0) / group.phase1Scores.length
        : 0;
        
      const phase2 = group.phase2Scores.length > 0
        ? group.phase2Scores.reduce((sum: number, score: number) => sum + score, 0) / group.phase2Scores.length
        : 0;
        
      const phase3 = group.phase3Scores.length > 0
        ? group.phase3Scores.reduce((sum: number, score: number) => sum + score, 0) / group.phase3Scores.length
        : 0;
      
      return {
        name: group.name,
        phase1: parseFloat(phase1.toFixed(2)),
        phase2: parseFloat(phase2.toFixed(2)),
        phase3: parseFloat(phase3.toFixed(2))
      };
    });
  };
  
  console.log("GroupBarChart rendering with data:", chartData?.length || 0, "items");
  
  // Log detailed data for debugging
  if (chartData && chartData.length > 0) {
    console.log("GroupBarChart first item:", chartData[0]);
  }
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
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
          label={{ value: 'Risk Perception Score', angle: -90, position: 'insideLeft' }} 
          domain={[0, 9]}
        />
        <Tooltip />
        <Legend />
        <Bar dataKey="phase1" name="Phase 1" fill="#22c55e" />
        <Bar dataKey="phase2" name="Phase 2" fill="#f59e0b" />
        <Bar dataKey="phase3" name="Phase 3" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  );
};