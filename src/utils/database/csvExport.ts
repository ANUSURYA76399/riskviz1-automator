
import { generateSampleData } from "./sampleData";
import { calculateRiskScore, getRiskLevel } from "../riskCalculations";

export interface CSVDataPoint {
  'Respondent Type'?: string;
  'Respondent Group'?: string;
  'Hotspot'?: string;
  'AO'?: string;
  'AO Location'?: string;
  'Phase'?: string | number;
  'Risk Score'?: string | number;
  'RP Score'?: string | number;
  'Likelihood'?: string | number;
  'Severity'?: string | number;
  'Risk Level'?: string;
  'Metric'?: string;
  'Metric Name'?: string;
  'Timeline'?: string;
  [key: string]: string | number | undefined;
}

export const downloadSampleTemplate = () => {
  const sampleData = generateSampleData();
  const csvContent = [
    ["Respondent Type", "Hotspot", "AO Location", "Phase", "RP Score", "Likelihood", "Severity", "Risk Level", "Metric Name", "Timeline"],
    ...sampleData.map(data => {
      const calculatedRiskScore = calculateRiskScore(Number(data.likelihood), Number(data.severity));
      const riskLevel = getRiskLevel(calculatedRiskScore);
      
      return [
        data.respondent_type,
        data.hotspot,
        data.ao_location,
        data.phase.toString(),
        calculatedRiskScore.toString(), // Use calculated score instead of stored
        data.likelihood.toString(),
        data.severity.toString(),
        riskLevel,
        data.metrics[0].name,
        data.timeline
      ];
    })
  ]
  .map(row => row.join(","))
  .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample_data_template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Parse uploaded CSV data and map risk levels
export const parseUploadedCSV = async (file: File) => {
  return new Promise<any[]>((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const rows = content.split('\n').filter(row => row.trim() !== '');
        const headers = rows[0].split(',').map(h => h.trim());
        
        console.log("CSV Headers:", headers);
        
        const data = rows.slice(1).map((row, index) => {
          const values = row.split(',').map(v => v.trim());
          const rowData: Record<string, string | number> = headers.reduce((obj, header, index) => {
            // Ensure we have a value
            obj[header] = values[index] || '';
            return obj;
          }, {} as Record<string, string | number>);
          
          // Calculate risk score based on likelihood and severity if needed
          if (rowData['Likelihood'] && rowData['Severity'] && !rowData['Risk Score'] && !rowData['RP Score']) {
            // Convert string values to numbers
            const likelihood = parseFloat(String(rowData['Likelihood']));
            const severity = parseFloat(String(rowData['Severity']));
            
            if (!isNaN(likelihood) && !isNaN(severity)) {
              const riskScore = calculateRiskScore(likelihood, severity);
              const riskLevel = getRiskLevel(riskScore);
              
              rowData['Risk Score'] = riskScore;
              rowData['Risk Level'] = riskLevel;
            }
          }
          
          // Add ID field for React keys if not present
          if (!rowData.id) {
            rowData.id = `row-${index}-${Date.now()}`;
          }
          
          console.log(`Parsed row ${index}:`, rowData);
          return rowData;
        });
        
        console.log("Parsed CSV data:", data);
        resolve(data);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
    
    reader.readAsText(file);
  });
};

// Connect parsed data to visualizations with better logging
export const connectParsedDataToVisualizations = (parsedData: any[]) => {
  if (!parsedData || !parsedData.length) {
    console.log("No parsed data to connect to visualizations");
    return null;
  }
  
  console.log("Connecting parsed data to visualizations:", parsedData.length, "rows");
  
  try {
    // Extract unique values for filters - handles different possible column names
    const uniqueValues = {
      AO: Array.from(new Set(parsedData.map(row => 
        row['AO Location'] || row['AO'] || row['Area'] || ''
      ).filter(Boolean))),
      
      Hotspot: Array.from(new Set(parsedData.map(row => 
        row['Hotspot'] || ''
      ).filter(Boolean))),
      
      RespondentGroup: Array.from(new Set(parsedData.map(row => 
        row['Respondent Type'] || row['Respondent Group'] || row['RespondentGroup'] || ''
      ).filter(Boolean))),
      
      Metric: Array.from(new Set(parsedData.map(row => 
        row['Metric Name'] || row['Metric'] || row['Risk Type'] || ''
      ).filter(Boolean))),
      
      Phase: Array.from(new Set(parsedData.map(row => {
        const phase = row['Phase'] || '';
        return phase !== '' ? Number(phase) : '';
      }).filter(val => val !== ''))),
      
      Timeline: Array.from(new Set(parsedData.map(row => 
        row['Timeline'] || row['Date'] || ''
      ).filter(Boolean))),
    };
    
    console.log("Extracted unique values from CSV:", uniqueValues);
    
    // Format data for GroupBarChart
    const formatForGroupBarChart = () => {
      // Define an explicit interface for the accumulator type
      interface GroupData {
        name: string;
        phase1: number;
        phase2: number;
        phase3: number;
        count1: number;
        count2: number;
        count3: number;
        dataCompleteness?: number;
        previousCompleteness?: number;
      }
      
      const groupedByRespondentType = parsedData.reduce<Record<string, GroupData>>((acc, row) => {
        const type = row['Respondent Type'] || row['Respondent Group'];
        if (!type) return acc;
        
        if (!acc[type]) {
          acc[type] = { 
            name: type, 
            phase1: 0, 
            phase2: 0, 
            phase3: 0, 
            count1: 0, 
            count2: 0, 
            count3: 0 
          };
        }
        
        const phase = Number(row['Phase']);
        let score = 0;
        
        // Make sure we have a valid number for the risk score
        if (row['Risk Score'] !== undefined || row['RP Score'] !== undefined) {
          score = parseFloat(String(row['Risk Score'] || row['RP Score']) || '0');
          if (isNaN(score)) {
            // If parsing fails, try to calculate from likelihood and severity
            const likelihood = parseFloat(String(row['Likelihood']) || '0');
            const severity = parseFloat(String(row['Severity']) || '0');
            if (!isNaN(likelihood) && !isNaN(severity)) {
              score = calculateRiskScore(likelihood, severity);
            }
          }
        }
        
        if (phase === 1) {
          acc[type].phase1 += score;
          acc[type].count1++;
        } else if (phase === 2) {
          acc[type].phase2 += score;
          acc[type].count2++;
        } else if (phase === 3) {
          acc[type].phase3 += score;
          acc[type].count3++;
        }
        
        return acc;
      }, {});
      
      // Calculate averages
      const result = Object.values(groupedByRespondentType).map(group => ({
        name: group.name,
        phase1: group.count1 > 0 ? +(group.phase1 / group.count1).toFixed(1) : 0,
        phase2: group.count2 > 0 ? +(group.phase2 / group.count2).toFixed(1) : 0,
        phase3: group.count3 > 0 ? +(group.phase3 / group.count3).toFixed(1) : 0,
        dataCompleteness: 100,
        previousCompleteness: 95
      }));
      
      console.log("Formatted GroupBarChart data:", result);
      return result;
    };
    
    // Format data for CombinedChart
    const formatForCombinedChart = () => {
      // Define an explicit interface for the accumulator type
      interface CombinedData {
        name: string;
        totalRiskScore: number;
        count: number;
        disruptionPercentage: number;
      }
      
      const groupedByRespondentType = parsedData.reduce<Record<string, CombinedData>>((acc, row) => {
        const type = row['Respondent Type'] || row['Respondent Group'];
        if (!type) return acc;
        
        if (!acc[type]) {
          acc[type] = { 
            name: type, 
            totalRiskScore: 0, 
            count: 0,
            // Generate pseudo-random disruption percentage based on respondent type name length
            disruptionPercentage: 25 + (type.length % 8) * 5
          };
        }
        
        // Ensure score is numeric
        let score = 0;
        if (row['Risk Score'] !== undefined || row['RP Score'] !== undefined) {
          score = parseFloat(String(row['Risk Score'] || row['RP Score']) || '0');
          if (isNaN(score)) {
            const likelihood = parseFloat(String(row['Likelihood']) || '0');
            const severity = parseFloat(String(row['Severity']) || '0');
            if (!isNaN(likelihood) && !isNaN(severity)) {
              score = calculateRiskScore(likelihood, severity);
            }
          }
        }
        
        acc[type].totalRiskScore += score;
        acc[type].count++;
        
        return acc;
      }, {});
      
      // Calculate averages
      const result = Object.values(groupedByRespondentType).map(group => ({
        name: group.name,
        riskScore: group.count > 0 ? +(group.totalRiskScore / group.count).toFixed(1) : 0,
        disruptionPercentage: group.disruptionPercentage
      }));
      
      console.log("Formatted CombinedChart data:", result);
      return result;
    };
    
    // Format data for ScatterPlot
    const formatForScatterPlot = () => {
      // Group metrics by category for scatter plot visuals
      const metricsData: Record<string, any[]> = {};
      
      parsedData.forEach(row => {
        const metricName = row['Metric Name'] || row['Metric'];
        // Ensure numeric values for likelihood and severity
        const likelihood = parseFloat(String(row['Likelihood']) || '0');
        const severity = parseFloat(String(row['Severity']) || '0');
        const score = parseFloat(String(row['Risk Score'] || row['RP Score']) || '0');
        
        if (!metricName || isNaN(likelihood) || isNaN(severity)) {
          console.log("Skipping row with invalid data:", row);
          return;
        }
        
        const riskScore = isNaN(score) ? calculateRiskScore(likelihood, severity) : score;
        
        // Generate a metric category based on name (for grouping similar metrics)
        // This is a simple hash function to create 4 categories
        const metricCategory = `Metric ${(metricName.length % 4) + 1}`;
        
        if (!metricsData[metricCategory]) {
          metricsData[metricCategory] = [];
        }
        
        metricsData[metricCategory].push({
          metric: metricCategory,
          x: likelihood, 
          y: severity, 
          z: riskScore,
          name: metricName
        });
      });
      
      // Convert to array format needed by ScatterPlot
      const result = Object.entries(metricsData).map(([name, data]) => ({
        name,
        data
      }));
      
      // Debug: Log sample data points
      if (result.length > 0) {
        console.log(`ScatterPlot formatted data: ${result.length} categories with ${result.reduce((sum, cat) => sum + cat.data.length, 0)} points`);
        result.forEach((category, idx) => {
          if (category.data.length > 0) {
            console.log(`Category ${idx} (${category.name}) sample:`, category.data[0]);
          }
        });
      } else {
        console.log("No data points for ScatterPlot");
      }
      
      return result;
    };
    
    // Calculate summary statistics
    const calculateSummaryStats = () => {
      const scores = parsedData
        .map(row => {
          const score = parseFloat(String(row['Risk Score'] || row['RP Score']) || '0');
          if (!isNaN(score)) return score;
          
          // Calculate from likelihood and severity if risk score is not available
          const likelihood = parseFloat(String(row['Likelihood']) || '0');
          const severity = parseFloat(String(row['Severity']) || '0');
          if (!isNaN(likelihood) && !isNaN(severity)) {
            return calculateRiskScore(likelihood, severity);
          }
          return NaN;
        })
        .filter(score => !isNaN(score));
      
      if (scores.length === 0) {
        console.log("No valid scores found for summary statistics");
        return {
          minScore: 0,
          maxScore: 0,
          avgScore: 0,
          riskLevels: {
            low: 0,
            moderate: 0,
            high: 0
          }
        };
      }
      
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      console.log("Score statistics:", {
        count: scores.length,
        min: minScore,
        max: maxScore,
        avg: avgScore
      });
      
      // Count risk levels
      const riskLevels = {
        low: 0,
        moderate: 0,
        high: 0
      };
      
      parsedData.forEach(row => {
        let riskLevel = row['Risk Level']?.toLowerCase();
        
        // If risk level is not available, calculate it
        if (!riskLevel) {
          const score = parseFloat(String(row['Risk Score'] || row['RP Score']) || '0');
          if (!isNaN(score)) {
            riskLevel = getRiskLevel(score).toLowerCase();
          } else {
            const likelihood = parseFloat(String(row['Likelihood']) || '0');
            const severity = parseFloat(String(row['Severity']) || '0');
            if (!isNaN(likelihood) && !isNaN(severity)) {
              const calculatedScore = calculateRiskScore(likelihood, severity);
              riskLevel = getRiskLevel(calculatedScore).toLowerCase();
            }
          }
        }
        
        if (riskLevel === 'low') riskLevels.low++;
        else if (riskLevel === 'moderate') riskLevels.moderate++;
        else if (riskLevel === 'high') riskLevels.high++;
      });
      
      console.log("Risk level counts:", riskLevels);
      
      return {
        minScore,
        maxScore,
        avgScore,
        riskLevels
      };
    };
    
    const results = {
      groupBarChartData: formatForGroupBarChart(),
      combinedChartData: formatForCombinedChart(),
      scatterPlotData: formatForScatterPlot(),
      rawData: parsedData,
      uniqueValues,
      summaryStats: calculateSummaryStats()
    };
    
    console.log("Final CSV Parsed Output for Charts:", results);
    
    return results;
  } catch (error) {
    console.error("Error processing chart data:", error);
    return null;
  }
};
