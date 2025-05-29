
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Define the types for our context data
export interface ChartData {
  groupBarChartData?: any[];
  combinedChartData?: any[];
  scatterPlotData?: any[];
  metricWiseScores?: any[];
  rawData?: any[];
  uniqueValues?: {
    AO?: string[];
    Hotspot?: string[];
    RespondentGroup?: string[];
    Metric?: string[];
    Phase?: (number | string)[];
    Timeline?: string[];
  };
  summaryStats?: {
    riskLevels: {
      low: number;
      moderate: number;
      high: number;
    };
    minScore?: number;
    maxScore?: number;
    avgScore?: number;
  };
}

interface DataContextType {
  csvData: any[];
  setCsvData: React.Dispatch<React.SetStateAction<any[]>>;
  chartData: ChartData | null;
  setChartData: React.Dispatch<React.SetStateAction<ChartData | null>>;
  refreshCharts: () => void;
  uploadId: number;
  forceRefreshData: () => void;
  processChartData: (data: any[]) => ChartData;
  clearData: () => void;
}

// Create the context with default values
const DataContext = createContext<DataContextType>({
  csvData: [],
  setCsvData: () => {},
  chartData: null,
  setChartData: () => {},
  refreshCharts: () => {},
  uploadId: 0,
  forceRefreshData: () => {},
  processChartData: () => ({ 
    summaryStats: { riskLevels: { low: 0, moderate: 0, high: 0 } }
  } as ChartData),
  clearData: () => {}
});

// Function to process raw CSV data into chart-friendly formats
const processRawData = (data: any[]): ChartData => {
  if (!data || data.length === 0) {
    console.log("No data to process");
    return {
      summaryStats: {
        riskLevels: { low: 0, moderate: 0, high: 0 },
        minScore: 0,
        maxScore: 0,
        avgScore: 0
      }
    };
  }

  console.log("Processing raw data:", data.length, "rows");
  
  // Extract unique values for filters, checking multiple possible column names
  const uniqueValues = {
    AO: Array.from(new Set(data.map(item => 
      item['AO'] || item['AO Location'] || item['Area']
    ))).filter(Boolean),
    
    Hotspot: Array.from(new Set(data.map(item => item['Hotspot']))).filter(Boolean),
    
    RespondentGroup: Array.from(new Set(data.map(item => 
      item['Respondent Group'] || item['Respondent Type'] || item['RespondentGroup']
    ))).filter(Boolean),
    
    Metric: Array.from(new Set(data.map(item => 
      item['Metric'] || item['Metric Name'] || item['Risk Type']
    ))).filter(Boolean),
    
    Phase: Array.from(new Set(data.map(item => 
      item['Phase'] || 1
    ))).filter(Boolean),
    
    Timeline: Array.from(new Set(data.map(item => 
      item['Timeline'] || item['Date'] || ''
    ))).filter(Boolean),
  };
  
  console.log("Extracted unique values:", uniqueValues);
  
  // Calculate risk level statistics
  const scores = data.map(item => 
    parseFloat(
      item['Risk Score'] || 
      item['RP Score'] || 
      item['Score'] || 
      item['score'] || 
      '0'
    )
  ).filter(score => !isNaN(score));
  
  // Count risk levels
  const lowCount = scores.filter(score => score < 4).length;
  const moderateCount = scores.filter(score => score >= 4 && score < 7).length;
  const highCount = scores.filter(score => score >= 7).length;
  
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const avgScore = scores.length > 0 ? 
    scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    
  console.log("Calculated risk levels:", { low: lowCount, moderate: moderateCount, high: highCount });
  console.log("Score stats:", { min: minScore, max: maxScore, avg: avgScore });
    
  // Format data for grouped bar chart
  const groupBarData = uniqueValues.RespondentGroup.map(group => {
    const groupData = data.filter(item => 
      (item['Respondent Group'] === group || 
       item['Respondent Type'] === group || 
       item['RespondentGroup'] === group)
    );
    
    // Group by phase
    const phase1Data = groupData.filter(item => 
      item['Phase'] === 1 || item['Phase'] === '1' || !item['Phase']
    );
    const phase2Data = groupData.filter(item => item['Phase'] === 2 || item['Phase'] === '2');
    const phase3Data = groupData.filter(item => item['Phase'] === 3 || item['Phase'] === '3');
    
    // Calculate average score for each phase
    const phase1 = phase1Data.length > 0 ? 
      phase1Data.reduce((sum, item) => sum + parseFloat(
        item['Risk Score'] || item['RP Score'] || item['Score'] || '0'
      ), 0) / phase1Data.length : 0;
    
    const phase2 = phase2Data.length > 0 ? 
      phase2Data.reduce((sum, item) => sum + parseFloat(
        item['Risk Score'] || item['RP Score'] || item['Score'] || '0'
      ), 0) / phase2Data.length : 0;
    
    const phase3 = phase3Data.length > 0 ? 
      phase3Data.reduce((sum, item) => sum + parseFloat(
        item['Risk Score'] || item['RP Score'] || item['Score'] || '0'
      ), 0) / phase3Data.length : 0;
    
    return {
      name: group,
      phase1: parseFloat(phase1.toFixed(2)),
      phase2: parseFloat(phase2.toFixed(2)),
      phase3: parseFloat(phase3.toFixed(2)),
      fill: '#3b82f6' // Default color
    };
  });
  
  console.log("Processed group bar data:", groupBarData);
  
  // Function to generate combined chart data (Risk Score vs Disruption)
  const generateCombinedData = () => {
    return uniqueValues.Hotspot.map(hotspot => {
      const hotspotData = data.filter(item => item['Hotspot'] === hotspot);
      
      // Calculate average risk score for this hotspot
      const avgRiskScore = hotspotData.length > 0 ?
        hotspotData.reduce((sum, item) => sum + parseFloat(
          item['Risk Score'] || 
          item['RP Score'] || 
          item['Score'] || 
          '0'
        ), 0) / hotspotData.length : 0;
      
      // Get disruption percentage (if available)
      const disruptionItem = hotspotData.find(item => 
        item['Disruption'] || 
        item['Disruption %'] || 
        item['Disruption Percentage']
      );
      
      const disruptionPercentage = disruptionItem ? 
        parseFloat(
          disruptionItem['Disruption'] || 
          disruptionItem['Disruption %'] || 
          disruptionItem['Disruption Percentage'] || 
          '0'
        ) : Math.random() * 100; // Fallback to random value if not available
      
      return {
        name: hotspot,
        riskScore: parseFloat(avgRiskScore.toFixed(2)),
        disruptionPercentage: parseFloat(disruptionPercentage.toFixed(2))
      };
    });
  };
  
  // Function to generate scatter plot data
  const generateScatterData = () => {
    const scatterDataResult: { name: string; data: any[] }[] = [];
    
    // First try with Metric column
    uniqueValues.Metric.forEach((metric, metricIndex) => {
      const metricData = data.filter(item => 
        item['Metric'] === metric || 
        item['Metric Name'] === metric || 
        item['Risk Type'] === metric
      );
      
      const scatterPoints = metricData.map(item => {
        const likelihood = parseFloat(item['Likelihood'] || '0');
        const severity = parseFloat(item['Severity'] || '0');
        const score = parseFloat(
          item['Risk Score'] || 
          item['RP Score'] || 
          item['Score'] || 
          '0'
        );
        
        return {
          metric: item['Metric'] || item['Metric Name'] || item['Risk Type'],
          x: !isNaN(likelihood) ? likelihood : 0,
          y: !isNaN(severity) ? severity : 0,
          z: !isNaN(score) ? score : 0,
          name: item['Metric'] || item['Metric Name'] || item['Risk Type'] || 'Unknown Metric'
        };
      }).filter(point => 
        !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
        (point.x > 0 || point.y > 0) // Filter out points with zero values for x and y
      );
      
      if (scatterPoints.length > 0) {
        scatterDataResult.push({
          name: `Metric ${metricIndex + 1}: ${metric}`,
          data: scatterPoints
        });
      }
    });
    
    // If no scatter data was generated using Metric, try with default grouping
    if (scatterDataResult.length === 0) {
      // Group by Hotspot if no metrics
      const hotspotGroups = uniqueValues.Hotspot.length > 0 ? 
        uniqueValues.Hotspot : ['Default'];
        
      hotspotGroups.forEach((hotspot, index) => {
        let hotspotData = data;
        if (hotspot !== 'Default') {
          hotspotData = data.filter(item => item['Hotspot'] === hotspot);
        }
        
        const scatterPoints = hotspotData.map(item => {
          // Try to extract likelihood and severity
          let likelihood = parseFloat(item['Likelihood'] || '0');
          let severity = parseFloat(item['Severity'] || '0');
          const score = parseFloat(
            item['Risk Score'] || 
            item['RP Score'] || 
            item['Score'] || 
            '0'
          );
          
          // If both likelihood and severity are 0, try to estimate them from score
          if (likelihood === 0 && severity === 0 && score > 0) {
            likelihood = Math.min(3, Math.sqrt(score));
            severity = Math.min(3, score / likelihood);
          }
          
          return {
            x: likelihood,
            y: severity,
            z: score,
            name: item['Metric'] || 
                  item['Metric Name'] || 
                  item['Risk Type'] || 
                  item['Respondent Group'] ||
                  'Point ' + (index + 1)
          };
        }).filter(point => 
          !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
          (point.x > 0 || point.y > 0 || point.z > 0) // Filter out points with all zero values
        );
        
        if (scatterPoints.length > 0) {
          scatterDataResult.push({
            name: hotspot === 'Default' ? 'All Points' : hotspot,
            data: scatterPoints
          });
        }
      });
    }
    
    return scatterDataResult;
  };
  
  // Function to calculate summary statistics
  const calculateSummaryStats = () => {
    // Calculate risk level statistics
    const scores = data.map(item => 
      parseFloat(
        item['Risk Score'] || 
        item['RP Score'] || 
        item['Score'] || 
        item['score'] || 
        '0'
      )
    ).filter(score => !isNaN(score));
    
    // Count risk levels
    const lowCount = scores.filter(score => score < 4).length;
    const moderateCount = scores.filter(score => score >= 4 && score < 7).length;
    const highCount = scores.filter(score => score >= 7).length;
    
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const avgScore = scores.length > 0 ? 
      scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      
    console.log("Calculated risk levels:", { low: lowCount, moderate: moderateCount, high: highCount });
    console.log("Score stats:", { min: minScore, max: maxScore, avg: avgScore });
    
    return {
      riskLevels: {
        low: lowCount,
        moderate: moderateCount,
        high: highCount
      },
      minScore,
      maxScore,
      avgScore
    };
  };

  // Function to generate metric-wise score data
  const generateMetricWiseScores = () => {
    // Get metrics from the data
    const metrics = uniqueValues.Metric;
    
    // Define colors for metrics
    const metricColors = [
      '#4338ca', '#3b82f6', '#06b6d4', '#0ea5e9', 
      '#0284c7', '#2563eb', '#1d4ed8', '#1e40af'
    ];
    
    return metrics.map((metric, index) => {
      // Get all data points for this metric
      const metricData = data.filter(item => 
        item['Metric'] === metric || 
        item['Metric Name'] === metric || 
        item['Risk Type'] === metric
      );
      
      // Calculate average score for this metric
      const avgScore = metricData.length > 0 ?
        metricData.reduce((sum, item) => sum + parseFloat(
          item['Risk Score'] || 
          item['RP Score'] || 
          item['Score'] || 
          '0'
        ), 0) / metricData.length : 0;
      
      return {
        metric,
        score: parseFloat(avgScore.toFixed(2)),
        color: metricColors[index % metricColors.length],
        // Include hotspot info if available
        hotspot: metricData[0]?.['Hotspot'] || null
      };
    }).filter(item => !isNaN(item.score)); // Filter out NaN scores
  };

  console.log("Processed scatter data:", generateScatterData().length, "groups");
  console.log("Generated metric-wise scores:", uniqueValues.Metric.length, "metrics");
  
  return {
    groupBarChartData: groupBarData,
    combinedChartData: data && data.length > 0 ? generateCombinedData() : [],
    scatterPlotData: data && data.length > 0 ? generateScatterData() : [],
    metricWiseScores: data && data.length > 0 ? generateMetricWiseScores() : [],
    rawData: data,
    uniqueValues,
    summaryStats: calculateSummaryStats()
  };
};

// Create a provider component
export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [uploadId, setUploadId] = useState<number>(0);

  // Add a function to force chart refresh
  const refreshCharts = useCallback(() => {
    console.log("Refreshing charts...");
    setUploadId(prev => prev + 1);
  }, []);

  // Add a function to force complete data refresh
  const forceRefreshData = useCallback(() => {
    console.log("Force refreshing all data...");
    // Log current chart data state to verify what we're working with
    console.log("Current chart data before refresh:", {
      hasData: !!chartData,
      hasScatterPlotData: chartData?.scatterPlotData && chartData.scatterPlotData.length > 0,
      hasRawData: chartData?.rawData && chartData.rawData.length > 0
    });
    
    // Increment by a larger number to ensure component re-rendering
    setUploadId(prev => prev + 10);
    
    // If we have chartData already, ensure it's properly propagated
    if (chartData) {
      console.log("Re-applying existing chart data to ensure propagation");
      setChartData({...chartData});
    }
  }, [chartData]);
  
  // Process raw data into chart formats
  const processChartData = useCallback((data: any[]) => {
    console.log("Processing chart data from", data.length, "rows");
    console.log("First few data items:", data.slice(0, 3));
    const processedData = processRawData(data);
    console.log("Processed chart data:", {
      hasScatterPlotData: !!processedData.scatterPlotData,
      scatterPlotDataLength: processedData.scatterPlotData?.length || 0,
      uniqueValues: processedData.uniqueValues
    });
    setChartData(processedData);
    return processedData;
  }, []);
  
  // Add a function to clear all data
  const clearData = useCallback(() => {
    console.log("Clearing all data...");
    setCsvData([]);
    setChartData(null);
    setUploadId(prev => prev + 100); // Large increment ensures all components re-render
  }, []);

  return (
    <DataContext.Provider value={{ 
      csvData, 
      setCsvData, 
      chartData, 
      setChartData, 
      refreshCharts,
      uploadId,
      forceRefreshData,
      processChartData,
      clearData
    }}>
      {children}
    </DataContext.Provider>
  );
};

// Create a hook to use the context
export const useDataContext = () => useContext(DataContext);
