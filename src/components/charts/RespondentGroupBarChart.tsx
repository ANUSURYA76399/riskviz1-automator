import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  Cell
} from 'recharts';
import { useDataContext } from '@/contexts/DataContext';
import { getRiskData } from '@/services/api';

interface RespondentGroupBarChartProps {
  height?: number;
  selectedHotspot?: string;
  selectedPhase?: number;
  showDataTable?: boolean;
}

export const RespondentGroupBarChart: React.FC<RespondentGroupBarChartProps> = ({
  height = 400,
  selectedHotspot = 'HS1',
  selectedPhase = 1,
  showDataTable = true
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { chartData: contextChartData, uploadId, csvData } = useDataContext();

  // Colors for bars - 10 different colors
  const barColors = [
    '#3498db', // Blue
    '#e74c3c', // Red
    '#2ecc71', // Green
    '#9b59b6', // Purple
    '#f1c40f', // Yellow
    '#e67e22', // Orange
    '#1abc9c', // Teal
    '#34495e', // Dark Blue
    '#7f8c8d', // Gray
    '#d35400'  // Dark Orange
  ];
  
  // Fetch data directly from backend
  const fetchBackendData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("RespondentGroupBarChart: Fetching data from backend");
      
      const riskData = await getRiskData();
      if (riskData && riskData.length > 0) {
        console.log("RespondentGroupBarChart: Retrieved risk data from backend:", riskData.length, "items");
        processData(riskData);
      } else {
        console.log("RespondentGroupBarChart: No risk data available from backend");
        setError("No risk data available");
      }
    } catch (error) {
      console.error("RespondentGroupBarChart: Error fetching data:", error);
      setError("Error fetching data from backend");
    } finally {
      setLoading(false);
    }
  }, []);

  // Process data when uploadId changes or on component mount
  useEffect(() => {
    if (uploadId > 0) {
      console.log("RespondentGroupBarChart: Upload ID changed, fetching fresh data");
      fetchBackendData();
    }
  }, [uploadId, fetchBackendData]);

  // Process data from context or props
  useEffect(() => {
    if (contextChartData?.rawData && contextChartData.rawData.length > 0) {
      console.log("RespondentGroupBarChart: Using data from context");
      processData(contextChartData.rawData);
    } else if (csvData && csvData.length > 0) {
      console.log("RespondentGroupBarChart: Using CSV data");
      processData(csvData);
    } else if (!loading && chartData.length === 0) {
      // Initial fetch if no data available
      fetchBackendData();
    }
  }, [contextChartData, csvData, fetchBackendData, loading, chartData.length]);

  // Process the raw data into chart format
  const processData = (data: any[]) => {
    if (!data || data.length === 0) {
      console.log("RespondentGroupBarChart: No data to process");
      setChartData([]);
      return;
    }

    console.log(`RespondentGroupBarChart: Processing data for ${selectedHotspot} - Phase ${selectedPhase}`);
    
    // Check all possible column names for our required fields
    const possibleRespondentNames = ['Respondent Group', 'Respondent Type', 'RespondentGroup', 'Group'];
    const possibleHotspotNames = ['Hotspot', 'HS', 'Area', 'Location'];
    const possiblePhaseNames = ['Phase', 'Phase Number', 'PhaseNumber'];
    const possibleScoreNames = ['Risk Score', 'RP Score', 'Score', 'Total Score', 'Rating'];
    
    // Extract relevant data points
    const filteredData = data.filter(item => {
      // Check hotspot matches
      let itemHotspot = '';
      for (const col of possibleHotspotNames) {
        if (item[col] && (item[col] === selectedHotspot || item[col].includes(selectedHotspot))) {
          itemHotspot = item[col];
          break;
        }
      }
      
      // Check phase matches
      let itemPhase = 0;
      for (const col of possiblePhaseNames) {
        if (item[col]) {
          const phaseValue = parseInt(item[col], 10);
          if (!isNaN(phaseValue)) {
            itemPhase = phaseValue;
            break;
          }
        }
      }
      
      return itemHotspot && itemPhase === selectedPhase;
    });
    
    console.log(`Filtered ${filteredData.length} records for ${selectedHotspot} - Phase ${selectedPhase}`);
    
    // Group by respondent group and calculate average scores
    const respondentScores: Record<string, number[]> = {};
    
    filteredData.forEach(item => {
      let respondentGroup = '';
      let score = 0;
      
      // Find respondent group
      for (const col of possibleRespondentNames) {
        if (item[col]) {
          respondentGroup = item[col];
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
      
      if (respondentGroup && score > 0) {
        if (!respondentScores[respondentGroup]) {
          respondentScores[respondentGroup] = [];
        }
        respondentScores[respondentGroup].push(score);
      }
    });
    
    // Create chart data points
    const chartDataPoints = Object.entries(respondentScores).map(([group, scores]) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      return {
        group,
        score: parseFloat(avgScore.toFixed(2))
      };
    });
    
    // Sort by score (descending)
    chartDataPoints.sort((a, b) => b.score - a.score);
    
    console.log("Processed chart data:", chartDataPoints);
    setChartData(chartDataPoints);
  };
  
  // If loading or no data, show placeholder
  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 border rounded-md">
        <p className="text-gray-500">Loading respondent group data...</p>
      </div>
    );
  }
  
  if (error || chartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 border rounded-md">
        <div className="text-center">
          <p className="text-gray-500 mb-2">
            {error || `No data available for ${selectedHotspot} - Phase ${selectedPhase}`}
          </p>
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
      const group = label;
      const score = payload[0].value;
      
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-semibold">{group}</p>
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
      <h3 className="text-lg font-semibold text-center mb-4">
        {`${selectedHotspot} - PHASE ${selectedPhase}`}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="group" 
            label={{ value: 'Respondent Groups', position: 'insideBottom', offset: -5 }}
            interval={0}
            tick={props => {
              const { x, y, payload } = props;
              return (
                <g transform={`translate(${x},${y})`}>
                  <text 
                    x={0} 
                    y={0} 
                    dy={16} 
                    textAnchor="end" 
                    fontSize={12}
                    transform="rotate(-45)"
                  >
                    {payload.value}
                  </text>
                </g>
              );
            }}
            height={100}
          />
          <YAxis 
            label={{ value: 'Mean RP Scores', angle: -90, position: 'insideLeft' }} 
            domain={[0, 9]}
          />
          <Tooltip content={customTooltip} />
          <Legend wrapperStyle={{ bottom: -10 }} />
          
          {/* Add a reference line for the moderate risk threshold */}
          <ReferenceLine y={3} stroke="orange" strokeDasharray="3 3">
            <Label value="Moderate Risk" position="right" />
          </ReferenceLine>
          
          {/* Bar for each respondent group */}
          <Bar 
            dataKey="score" 
            fill="#8884d8" 
            name="RP Score"
            label={{
              position: 'top',
              formatter: (value: number) => value.toFixed(2)
            }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Data table */}
      {showDataTable && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="py-2 px-4 border">Respondent Group</th>
                <th className="py-2 px-4 border">RP Score</th>
                <th className="py-2 px-4 border">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((data, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2 px-4 border">{data.group}</td>
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

export default RespondentGroupBarChart;
