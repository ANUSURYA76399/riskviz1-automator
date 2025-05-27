import React, { useState, useEffect, useCallback } from 'react';
import { useDataContext } from '@/contexts/DataContext';
import { getRiskData } from '@/services/api';

interface LocationPhaseComparisonChartProps {
  selectedLocation?: string;
  showDataTable?: boolean;
}

export const LocationPhaseComparisonChart: React.FC<LocationPhaseComparisonChartProps> = ({
  selectedLocation = 'Mumbai',
  showDataTable = true
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { chartData: contextChartData, uploadId, csvData } = useDataContext();
  
  // Fetch data directly from backend
  const fetchBackendData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("LocationPhaseComparisonChart: Fetching data from backend");
      
      const riskData = await getRiskData();
      if (riskData && riskData.length > 0) {
        console.log("LocationPhaseComparisonChart: Retrieved risk data from backend:", riskData.length, "items");
        processData(riskData);
      } else {
        console.log("LocationPhaseComparisonChart: No risk data available from backend");
        setError("No risk data available");
      }
    } catch (error) {
      console.error("LocationPhaseComparisonChart: Error fetching data:", error);
      setError("Error fetching data from backend");
    } finally {
      setLoading(false);
    }
  }, []);

  // Process data when uploadId changes or on component mount
  useEffect(() => {
    if (uploadId > 0) {
      console.log("LocationPhaseComparisonChart: Upload ID changed, fetching fresh data");
      fetchBackendData();
    }
  }, [uploadId, fetchBackendData]);

  // Process data from context or props
  useEffect(() => {
    if (contextChartData?.rawData && contextChartData.rawData.length > 0) {
      console.log("LocationPhaseComparisonChart: Using data from context");
      processData(contextChartData.rawData);
    } else if (csvData && csvData.length > 0) {
      console.log("LocationPhaseComparisonChart: Using CSV data");
      processData(csvData);
    } else if (!loading && chartData.length === 0) {
      // Initial fetch if no data available
      fetchBackendData();
    }
  }, [contextChartData, csvData, fetchBackendData, loading, chartData.length]);

  // Process the raw data into chart format
  const processData = (data: any[]) => {
    if (!data || data.length === 0) {
      console.log("LocationPhaseComparisonChart: No data to process");
      setChartData([]);
      return;
    }

    console.log(`LocationPhaseComparisonChart: Processing data for ${selectedLocation}`);
    
    // Check all possible column names for our required fields
    const possibleRespondentNames = ['Respondent Group', 'Respondent Type', 'RespondentGroup', 'Group'];
    const possibleLocationNames = ['Location', 'City', 'Area', 'Region'];
    const possiblePhaseNames = ['Phase', 'Phase Number', 'PhaseNumber'];
    const possibleScoreNames = ['Risk Score', 'RP Score', 'Score', 'Total Score', 'Rating'];
    
    // Extract relevant data points
    const filteredData = data.filter(item => {
      // Check location matches
      let itemLocation = '';
      for (const col of possibleLocationNames) {
        if (item[col] && item[col].toLowerCase().includes(selectedLocation.toLowerCase())) {
          itemLocation = item[col];
          break;
        }
      }
      
      return itemLocation;
    });
    
    console.log(`Filtered ${filteredData.length} records for ${selectedLocation}`);
    
    // Group by respondent group and phase, then calculate average scores
    const groupData: Record<string, Record<string, number[]>> = {};
    
    filteredData.forEach(item => {
      let respondentGroup = '';
      let phase = '';
      let score = 0;
      
      // Find respondent group
      for (const col of possibleRespondentNames) {
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
            phase = `PHASE ${phaseValue}`;
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
        const phaseName = `PHASE ${i}`;
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
        <p className="text-gray-500">Loading location phase comparison data...</p>
      </div>
    );
  }
  
  if (error || chartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 border rounded-md">
        <div className="text-center">
          <p className="text-gray-500 mb-2">
            {error || `No data available for ${selectedLocation}`}
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
  
  // Get risk level class
  const getRiskLevelClass = (score: number | null) => {
    if (score === null) return 'bg-gray-200';
    if (score >= 6) return 'bg-red-200';
    if (score >= 3) return 'bg-yellow-200';
    return 'bg-green-200';
  };
  
  return (
    <div className="w-full p-4 bg-white shadow rounded-lg">
      <h3 className="text-lg font-semibold text-center mb-4">
        {selectedLocation}
      </h3>
      
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border border-gray-300 text-left">Respondent Group</th>
              <th className="p-2 border border-gray-300 text-center">PHASE 1</th>
              <th className="p-2 border border-gray-300 text-center">PHASE 2</th>
              <th className="p-2 border border-gray-300 text-center">PHASE 3</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-2 border border-gray-300 font-medium">
                  {row.group}
                </td>
                <td className={`p-2 border border-gray-300 text-center ${getRiskLevelClass(row['PHASE 1'])}`}>
                  {row['PHASE 1'] !== null ? row['PHASE 1'] : '-'}
                </td>
                <td className={`p-2 border border-gray-300 text-center ${getRiskLevelClass(row['PHASE 2'])}`}>
                  {row['PHASE 2'] !== null ? row['PHASE 2'] : '-'}
                </td>
                <td className={`p-2 border border-gray-300 text-center ${getRiskLevelClass(row['PHASE 3'])}`}>
                  {row['PHASE 3'] !== null ? row['PHASE 3'] : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Color Key:</p>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-200 mr-2"></div>
            <span>High Risk (≥ 6)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-200 mr-2"></div>
            <span>Moderate Risk (3-5.9)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-200 mr-2"></div>
            <span>Low Risk (&lt; 3)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPhaseComparisonChart;
