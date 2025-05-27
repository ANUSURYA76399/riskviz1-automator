import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useDataContext } from '@/contexts/DataContext';
import { getRiskData } from '@/services/api';

interface PhaseComparisonLineChartProps {
  height?: number;
  selectedHotspot?: string;
  showDataTable?: boolean;
}

export const PhaseComparisonLineChart: React.FC<PhaseComparisonLineChartProps> = ({
  height = 400,
  selectedHotspot = 'HS1',
  showDataTable = true
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { chartData: contextChartData, uploadId, csvData } = useDataContext();

  // Colors for each phase
  const phaseColors = {
    'Phase 1': '#3498db', // Blue
    'Phase 2': '#e74c3c', // Red
    'Phase 3': '#2ecc71'  // Green
  };
  
  // Fetch data directly from backend
  const fetchBackendData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("PhaseComparisonLineChart: Fetching data from backend");
      
      const riskData = await getRiskData();
      if (riskData && riskData.length > 0) {
        console.log("PhaseComparisonLineChart: Retrieved risk data from backend:", riskData.length, "items");
        processData(riskData);
      } else {
        console.log("PhaseComparisonLineChart: No risk data available from backend");
        setError("No risk data available");
      }
    } catch (error) {
      console.error("PhaseComparisonLineChart: Error fetching data:", error);
      setError("Error fetching data from backend");
    } finally {
      setLoading(false);
    }
  }, []);

  // Process data when uploadId changes or on component mount
  useEffect(() => {
    if (uploadId > 0) {
      console.log("PhaseComparisonLineChart: Upload ID changed, fetching fresh data");
      fetchBackendData();
    }
  }, [uploadId, fetchBackendData]);

  // Process data from context or props
  useEffect(() => {
    if (contextChartData?.rawData && contextChartData.rawData.length > 0) {
      console.log("PhaseComparisonLineChart: Using data from context");
      processData(contextChartData.rawData);
    } else if (csvData && csvData.length > 0) {
      console.log("PhaseComparisonLineChart: Using CSV data");
      processData(csvData);
    } else if (!loading && chartData.length === 0) {
      // Initial fetch if no data available
      fetchBackendData();
    }
  }, [contextChartData, csvData, fetchBackendData, loading, chartData.length]);

  // Process the raw data into chart format
  const processData = (data: any[]) => {
    if (!data || data.length === 0) {
      console.log("PhaseComparisonLineChart: No data to process");
      setChartData([]);
      return;
    }

    console.log(`PhaseComparisonLineChart: Processing data for ${selectedHotspot}`);
    
    // Check all possible column names for our required fields
    const possibleHotspotNames = ['Hotspot', 'Hotspot Name', 'HS', 'Location', 'Area', 'Region', 'HotspotName', 'hotspot_name', 'hotspot_id'];
    const possiblePhaseNames = ['Phase', 'Phase Number', 'PhaseNumber', 'phase_number', 'phase_id', 'phase'];
    const possibleGroupNames = ['Respondent Group', 'Respondent Type', 'RespondentGroup', 'Group', 'respondent_group', 'group_name'];
    const possibleScoreNames = ['Risk Score', 'RP Score', 'Score', 'Total Score', 'Rating', 'risk_score', 'score'];
    
    // Filter data for the selected hotspot with more flexible matching
    const filteredData = data.filter(item => {
      // Try to find a matching hotspot field
      for (const field of possibleHotspotNames) {
        if (item[field] && 
            (item[field].toString().toLowerCase() === selectedHotspot.toLowerCase() || 
             item[field].toString().toLowerCase().includes(selectedHotspot.toLowerCase()))) {
          return true;
        }
      }
      
      let itemHotspot = '';
      for (const col of possibleHotspotNames) {
        if (item[col] && (item[col] === selectedHotspot || item[col].includes(selectedHotspot))) {
          itemHotspot = item[col];
          break;
        }
      }
      
      return itemHotspot;
    });
    
    console.log(`Filtered ${filteredData.length} records for ${selectedHotspot}`);
    
    // Group by respondent group and phase, then calculate average scores
    const groupData: Record<string, Record<string, number[]>> = {};
    
    filteredData.forEach(item => {
      let respondentGroup = '';
      let phase = '';
      let score = 0;
      
      // Find respondent group
      for (const col of possibleGroupNames) {
        if (item[col]) {
          respondentGroup = item[col];
          break;
        }
      }
      
      // Find phase
      for (const col of possiblePhaseNames) {
        if (item[col]) {
          const phaseValue = parseInt(item[col], 10);
          if (!isNaN(phaseValue)) {
            phase = `Phase ${phaseValue}`;
            break;
          }
        }
      }
      
      // Find score value
      for (const col of possibleScoreNames) {
        if (item[col]) {
          score = parseFloat(item[col]) || 0;
          break;
        }
      }
      
      if (respondentGroup && phase && score > 0) {
        if (!groupData[respondentGroup]) {
          groupData[respondentGroup] = {};
        }
        if (!groupData[respondentGroup][phase]) {
          groupData[respondentGroup][phase] = [];
        }
        groupData[respondentGroup][phase].push(score);
      }
    });
    
    // Create chart data points
    const respondentGroups = Object.keys(groupData);
    const chartDataPoints = respondentGroups.map(group => {
      const groupEntry: any = { group };
      
      // Calculate average scores for each phase
      for (let i = 1; i <= 3; i++) {
        const phaseName = `Phase ${i}`;
        const phaseScores = groupData[group][phaseName] || [];
        
        if (phaseScores.length > 0) {
          const avgScore = phaseScores.reduce((sum, score) => sum + score, 0) / phaseScores.length;
          groupEntry[phaseName] = parseFloat(avgScore.toFixed(2));
        } else {
          groupEntry[phaseName] = null;
        }
      }
      
      return groupEntry;
    });
    
    console.log("Processed chart data:", chartDataPoints);
    setChartData(chartDataPoints);
  };
  
  // If loading or no data, show placeholder
  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 border rounded-md">
        <p className="text-gray-500">Loading phase comparison data...</p>
      </div>
    );
  }
  
  if (error || chartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 border rounded-md">
        <div className="text-center">
          <p className="text-gray-500 mb-2">
            {error || `No phase comparison data available for ${selectedHotspot}`}
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
      
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-semibold">{group}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value !== null ? entry.value : 'No data'}</span>
            </p>
          ))}
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="w-full p-4 bg-white shadow rounded-lg">
      <h3 className="text-lg font-semibold text-center mb-4">
        {`RP scores of ${selectedHotspot} at different phases`}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="group" 
            label={{ value: 'Respondent Groups', position: 'insideBottom', offset: -5 }}
            interval={0}
            tick={(props) => {
              const { x, y, payload } = props;
              return (
                <g transform={`translate(${x},${y})`}>
                  <text 
                    x={0} 
                    y={0} 
                    dy={16} 
                    textAnchor="end" 
                    fill="#666" 
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
            label={{ value: 'Mean RP scores', angle: -90, position: 'insideLeft' }} 
            domain={[0, 9]}
          />
          <Tooltip content={customTooltip} />
          <Legend wrapperStyle={{ bottom: -10 }} />
          
          {/* Line for Phase 1 */}
          <Line 
            type="monotone" 
            dataKey="Phase 1" 
            stroke={phaseColors['Phase 1']}
            strokeWidth={2}
            activeDot={{ r: 8 }}
            connectNulls={true}
          />
          
          {/* Line for Phase 2 */}
          <Line 
            type="monotone" 
            dataKey="Phase 2" 
            stroke={phaseColors['Phase 2']} 
            strokeWidth={2}
            activeDot={{ r: 8 }}
            connectNulls={true}
          />
          
          {/* Line for Phase 3 */}
          <Line 
            type="monotone" 
            dataKey="Phase 3" 
            stroke={phaseColors['Phase 3']} 
            strokeWidth={2}
            activeDot={{ r: 8 }}
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Data table */}
      {showDataTable && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="py-2 px-4 border">Respondent Group</th>
                <th className="py-2 px-4 border">Phase 1</th>
                <th className="py-2 px-4 border">Phase 2</th>
                <th className="py-2 px-4 border">Phase 3</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((data, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2 px-4 border">{data.group}</td>
                  <td className="py-2 px-4 border text-center" style={{ color: phaseColors['Phase 1'] }}>
                    {data['Phase 1'] !== null ? data['Phase 1'] : '-'}
                  </td>
                  <td className="py-2 px-4 border text-center" style={{ color: phaseColors['Phase 2'] }}>
                    {data['Phase 2'] !== null ? data['Phase 2'] : '-'}
                  </td>
                  <td className="py-2 px-4 border text-center" style={{ color: phaseColors['Phase 3'] }}>
                    {data['Phase 3'] !== null ? data['Phase 3'] : '-'}
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

export default PhaseComparisonLineChart;
