
// Visualization insights and helper functions for the data visualization components
import { useDataContext } from "@/contexts/DataContext";

// Data summary helper function that returns values calculated from uploaded data
export const getDataSummary = (location: string = 'HS1') => {
  // Get data from context directly - this is used in components
  const getContextualizedData = () => {
    // This is a placeholder - the actual implementation
    // will access the DataContext via React hooks in components
    return null;
  };
  
  // Helper function that can be used outside of React components
  const calculateSummaryFromData = (data: any[]) => {
    if (!data || data.length === 0) {
      // Default fallback values if no data available
      return {
        minRPScore: 0,
        maxRPScore: 0,
        avgRPScore: 0,
        completeness: 0,
        trendChange: 0,
        riskLevel: 'Unknown',
        hotspots: 0,
        respondents: 0,
        dataRange: 'No data available'
      };
    }
    
    // Filter data for the specific location
    const locationData = data.filter(row => 
      (row['AO'] === location) || 
      (row['AO Location'] === location) || 
      (row['Area'] === location)
    );
    
    if (locationData.length === 0) return {
      minRPScore: 0,
      maxRPScore: 0,
      avgRPScore: 0,
      completeness: 0,
      trendChange: 0,
      riskLevel: 'Unknown',
      hotspots: 0,
      respondents: 0,
      dataRange: 'No data available'
    };
    
    // Extract risk scores
    const scores = locationData.map(row => 
      parseFloat(row['Risk Score'] || row['RP Score'] || row['Score'] || '0')
    ).filter(score => !isNaN(score));
    
    // Calculate summary statistics
    const minRPScore = scores.length > 0 ? Math.min(...scores) : 0;
    const maxRPScore = scores.length > 0 ? Math.max(...scores) : 0;
    const avgRPScore = scores.length > 0 ? 
      scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    
    // Calculate completeness based on non-empty fields
    let completenessSum = 0;
    let fieldsChecked = 0;
    
    locationData.forEach(row => {
      // Check key fields that should be filled
      const keyFields = ['Risk Score', 'RP Score', 'Score', 
                         'Hotspot', 'Metric', 'Metric Name',
                         'Respondent Type', 'Respondent Group',
                         'Phase', 'Likelihood', 'Severity'];
      
      keyFields.forEach(field => {
        const hasValue = Object.keys(row).some(key => 
          key.toLowerCase() === field.toLowerCase() && 
          row[key] !== null && 
          row[key] !== undefined && 
          row[key] !== ''
        );
        
        if (hasValue) completenessSum++;
        fieldsChecked++;
      });
    });
    
    const completeness = fieldsChecked > 0 ? 
      Math.round((completenessSum / fieldsChecked) * 100) : 0;
    
    // Calculate trend change (comparing phases if available)
    let trendChange = 0;
    const phaseGroups = new Map();
    locationData.forEach(row => {
      const phase = row['Phase'];
      if (phase) {
        const score = parseFloat(row['Risk Score'] || row['RP Score'] || row['Score'] || '0');
        if (!isNaN(score)) {
          if (phaseGroups.has(phase)) {
            phaseGroups.get(phase).push(score);
          } else {
            phaseGroups.set(phase, [score]);
          }
        }
      }
    });
    
    if (phaseGroups.size >= 2) {
      const phases = Array.from(phaseGroups.keys()).sort();
      const firstPhaseAvg = phaseGroups.get(phases[0]).reduce((sum: number, score: number) => sum + score, 0) / 
                           phaseGroups.get(phases[0]).length;
      const lastPhaseAvg = phaseGroups.get(phases[phases.length - 1]).reduce((sum: number, score: number) => sum + score, 0) / 
                          phaseGroups.get(phases[phases.length - 1]).length;
      
      trendChange = parseFloat((lastPhaseAvg - firstPhaseAvg).toFixed(1));
    }
    
    // Determine risk level based on average score
    let riskLevel = 'Low';
    if (avgRPScore >= 7) {
      riskLevel = 'High';
    } else if (avgRPScore >= 4) {
      riskLevel = 'Moderate';
    }
    
    // Count unique hotspots
    const uniqueHotspots = new Set();
    locationData.forEach(row => {
      const hotspot = row['Hotspot'];
      if (hotspot) uniqueHotspots.add(hotspot);
    });
    
    // Count unique respondents
    const uniqueRespondents = new Set();
    locationData.forEach(row => {
      const respondent = row['Respondent Type'] || row['Respondent Group'] || row['RespondentGroup'];
      if (respondent) uniqueRespondents.add(respondent);
    });
    
    // Get data range - look for date fields or use phases
    let dataRange = 'March 2025-May 2025'; // Default fallback
    const dates = locationData
      .map(row => row['Date'] || row['Timeline'] || row['Collection Date'])
      .filter(Boolean);
    
    if (dates.length > 0) {
      const sortedDates = [...dates].sort();
      dataRange = `${sortedDates[0]} - ${sortedDates[sortedDates.length - 1]}`;
    }
    
    return {
      minRPScore: parseFloat(minRPScore.toFixed(1)),
      maxRPScore: parseFloat(maxRPScore.toFixed(1)),
      avgRPScore: parseFloat(avgRPScore.toFixed(2)),
      completeness,
      trendChange,
      riskLevel,
      hotspots: uniqueHotspots.size,
      respondents: uniqueRespondents.size,
      dataRange
    };
  };
  
  return calculateSummaryFromData([]);  // Empty default - will be populated in components
};

// Generate insights based on dynamic visualization data
export const generateVisualizationInsights = (data: any[], location: string = 'HS1') => {
  if (!data || data.length === 0) {
    return [
      {
        title: "No Data Available",
        description: "Upload data to see insights.",
        severity: "low",
      }
    ];
  }
  
  // Filter data for the specific location
  const locationData = data.filter(row => 
    (row['AO'] === location) || 
    (row['AO Location'] === location) || 
    (row['Area'] === location)
  );
  
  if (locationData.length === 0) {
    return [
      {
        title: "No Data for This Location",
        description: `No data available for ${location}. Please check your filters or upload location-specific data.`,
        severity: "medium",
      }
    ];
  }
  
  // Extract risk scores
  const scores = locationData.map(row => 
    parseFloat(row['Risk Score'] || row['RP Score'] || row['Score'] || '0')
  ).filter(score => !isNaN(score));
  
  const avgScore = scores.length > 0 ? 
    scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  
  // Calculate trend change
  let trendChange = 0;
  const phaseGroups = new Map();
  locationData.forEach(row => {
    const phase = row['Phase'];
    if (phase) {
      const score = parseFloat(row['Risk Score'] || row['RP Score'] || row['Score'] || '0');
      if (!isNaN(score)) {
        if (phaseGroups.has(phase)) {
          phaseGroups.get(phase).push(score);
        } else {
          phaseGroups.set(phase, [score]);
        }
      }
    }
  });
  
  if (phaseGroups.size >= 2) {
    const phases = Array.from(phaseGroups.keys()).sort();
    const firstPhaseAvg = phaseGroups.get(phases[0]).reduce((sum: number, score: number) => sum + score, 0) / 
                         phaseGroups.get(phases[0]).length;
    const lastPhaseAvg = phaseGroups.get(phases[phases.length - 1]).reduce((sum: number, score: number) => sum + score, 0) / 
                         phaseGroups.get(phases[phases.length - 1]).length;
    
    trendChange = parseFloat((lastPhaseAvg - firstPhaseAvg).toFixed(1));
  }
  
  // Calculate data completeness
  let completenessSum = 0;
  let fieldsChecked = 0;
  
  locationData.forEach(row => {
    const keyFields = ['Risk Score', 'RP Score', 'Score', 
                       'Hotspot', 'Metric', 'Metric Name',
                       'Respondent Type', 'Respondent Group',
                       'Phase', 'Likelihood', 'Severity'];
    
    keyFields.forEach(field => {
      const hasValue = Object.keys(row).some(key => 
        key.toLowerCase() === field.toLowerCase() && 
        row[key] !== null && 
        row[key] !== undefined && 
        row[key] !== ''
      );
      
      if (hasValue) completenessSum++;
      fieldsChecked++;
    });
  });
  
  const completeness = fieldsChecked > 0 ? 
    Math.round((completenessSum / fieldsChecked) * 100) : 0;
  
  // Generate dynamic insights based on calculated values
  const insights = [];
  
  // Risk Score Analysis
  insights.push({
    title: "Risk Score Analysis",
    description: `${location} shows ${avgScore < 4 ? 'low' : avgScore < 7 ? 'moderate' : 'high'} overall risk perception with scores ranging from ${minScore.toFixed(1)} to ${maxScore.toFixed(1)}, averaging ${avgScore.toFixed(2)}.`,
    severity: avgScore >= 7 ? "high" : avgScore >= 4 ? "medium" : "low",
  });
  
  // Trend Recognition (if available)
  if (phaseGroups.size >= 2) {
    insights.push({
      title: "Trend Recognition",
      description: `Risk perception scores in ${location} have ${trendChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(trendChange).toFixed(1)} points since the previous phase.`,
      severity: Math.abs(trendChange) > 1 ? "medium" : "low",
    });
  }
  
  // Key Focus Areas (highest risk score)
  if (scores.length > 0) {
    // Find metric with highest score
    let highestScoreMetric = "";
    let highestScore = 0;
    
    locationData.forEach(row => {
      const score = parseFloat(row['Risk Score'] || row['RP Score'] || row['Score'] || '0');
      if (!isNaN(score) && score > highestScore) {
        highestScore = score;
        highestScoreMetric = row['Metric'] || row['Metric Name'] || row['Risk Type'] || "Unknown metric";
      }
    });
    
    if (highestScoreMetric) {
      insights.push({
        title: "Key Focus Areas",
        description: `${highestScoreMetric} has the highest risk score (${highestScore.toFixed(1)}) and requires immediate attention.`,
        severity: highestScore >= 7 ? "high" : "medium",
      });
    }
  }
  
  // Data Validity
  insights.push({
    title: "Data Validity",
    description: `Current data has ${completeness}% completeness, ${completeness >= 90 ? 'providing reliable' : completeness >= 70 ? 'providing adequate' : 'requiring improvement for'} basis for strategic decision making.`,
    severity: completeness >= 90 ? "low" : completeness >= 70 ? "medium" : "high",
  });
  
  return insights;
};

// Retrieve recommendations based on dynamically calculated visualization data
export const getVisualizationRecommendations = (data: any[], location: string = 'HS1') => {
  if (!data || data.length === 0) {
    return [
      {
        title: "Upload Data",
        description: "Upload your risk assessment data to receive recommendations",
        priority: "high",
      }
    ];
  }
  
  // Filter data for the specific location
  const locationData = data.filter(row => 
    (row['AO'] === location) || 
    (row['AO Location'] === location) || 
    (row['Area'] === location)
  );
  
  // Extract risk scores
  const scores = locationData.map(row => 
    parseFloat(row['Risk Score'] || row['RP Score'] || row['Score'] || '0')
  ).filter(score => !isNaN(score));
  
  const avgScore = scores.length > 0 ? 
    scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  
  // Count high-risk metrics (score >= 5.5)
  const highRiskCount = scores.filter(score => score >= 5.5).length;
  
  // Calculate data completeness
  let completenessSum = 0;
  let fieldsChecked = 0;
  locationData.forEach(row => {
    const keyFields = ['Risk Score', 'RP Score', 'Score', 
                      'Hotspot', 'Metric', 'Metric Name',
                      'Respondent Type', 'Respondent Group',
                      'Phase', 'Likelihood', 'Severity'];
    
    keyFields.forEach(field => {
      const hasValue = Object.keys(row).some(key => 
        key.toLowerCase() === field.toLowerCase() && 
        row[key] !== null && 
        row[key] !== undefined && 
        row[key] !== ''
      );
      
      if (hasValue) completenessSum++;
      fieldsChecked++;
    });
  });
  
  const completeness = fieldsChecked > 0 ? 
    Math.round((completenessSum / fieldsChecked) * 100) : 0;
  
  // Count unique respondent types
  const respondentTypes = new Set();
  locationData.forEach(row => {
    const respondentType = row['Respondent Type'] || row['Respondent Group'] || row['RespondentGroup'];
    if (respondentType) respondentTypes.add(respondentType);
  });
  
  // Generate dynamic recommendations
  const recommendations = [];
  
  // Address high-risk areas
  if (highRiskCount > 0) {
    recommendations.push({
      title: "Address High-Risk Areas",
      description: `Focus resources on ${highRiskCount} areas with RP scores above 5.5 in ${location}`,
      priority: highRiskCount >= 3 ? "high" : "medium",
    });
  } else {
    recommendations.push({
      title: "Maintain Low Risk Status",
      description: `Continue current strategies in ${location} to maintain positive risk profile`,
      priority: "low",
    });
  }
  
  // Regular monitoring recommendation
  recommendations.push({
    title: "Regular Monitoring",
    description: `Implement ${avgScore >= 7 ? 'weekly' : avgScore >= 4 ? 'bi-weekly' : 'monthly'} monitoring of risk metrics for ${location}`,
    priority: avgScore >= 7 ? "high" : "medium",
  });
  
  // Stakeholder engagement recommendation
  recommendations.push({
    title: "Stakeholder Engagement",
    description: respondentTypes.size < 3 ? 
      "Increase community involvement in risk assessment processes" :
      "Maintain diverse stakeholder involvement in assessment processes",
    priority: respondentTypes.size < 3 ? "medium" : "low",
  });
  
  // Data collection recommendation
  if (completeness < 90) {
    recommendations.push({
      title: "Data Collection Improvements",
      description: completeness < 70 ? 
        "Significantly expand data collection to improve analysis accuracy" :
        "Expand respondent base to improve data completeness",
      priority: completeness < 70 ? "high" : "medium",
    });
  }
  
  return recommendations;
};

// Get data comparison insights between different time periods using dynamic data
export const getComparisonInsights = (data: any[], location: string = 'HS1', period: string = 'phase') => {
  if (!data || data.length === 0) {
    return {
      changes: [],
      summary: "No data available for comparison."
    };
  }
  
  // Filter data for the specific location
  const locationData = data.filter(row => 
    (row['AO'] === location) || 
    (row['AO Location'] === location) || 
    (row['Area'] === location)
  );
  
  if (locationData.length === 0) {
    return {
      changes: [],
      summary: `No data available for ${location}.`
    };
  }
  
  // Group data by phases to compare
  const phaseGroups = new Map();
  locationData.forEach(row => {
    const phase = row['Phase'];
    if (phase) {
      if (!phaseGroups.has(phase)) {
        phaseGroups.set(phase, []);
      }
      phaseGroups.get(phase).push(row);
    }
  });
  
  if (phaseGroups.size < 2) {
    return {
      changes: [],
      summary: `Insufficient phase data for ${location} to make comparisons.`
    };
  }
  
  const phases = Array.from(phaseGroups.keys()).sort();
  const firstPhase = phases[0];
  const lastPhase = phases[phases.length - 1];
  
  const firstPhaseData = phaseGroups.get(firstPhase);
  const lastPhaseData = phaseGroups.get(lastPhase);
  
  // Calculate metrics for each phase
  const calculatePhaseMetrics = (phaseData: any[]) => {
    const scores = phaseData.map(row => 
      parseFloat(row['Risk Score'] || row['RP Score'] || row['Score'] || '0')
    ).filter(score => !isNaN(score));
    
    const avgScore = scores.length > 0 ? 
      scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    
    const highRiskCount = scores.filter(score => score >= 7).length;
    
    // Calculate data completeness
    let completenessSum = 0;
    let fieldsChecked = 0;
    phaseData.forEach(row => {
      const keyFields = ['Risk Score', 'RP Score', 'Score', 
                        'Hotspot', 'Metric', 'Metric Name',
                        'Respondent Type', 'Respondent Group',
                        'Likelihood', 'Severity'];
      
      keyFields.forEach(field => {
        const hasValue = Object.keys(row).some(key => 
          key.toLowerCase() === field.toLowerCase() && 
          row[key] !== null && 
          row[key] !== undefined && 
          row[key] !== ''
        );
        
        if (hasValue) completenessSum++;
        fieldsChecked++;
      });
    });
    
    const completeness = fieldsChecked > 0 ? 
      Math.round((completenessSum / fieldsChecked) * 100) : 0;
      
    return {
      avgScore: parseFloat(avgScore.toFixed(2)),
      highRiskCount,
      completeness
    };
  };
  
  const firstMetrics = calculatePhaseMetrics(firstPhaseData);
  const lastMetrics = calculatePhaseMetrics(lastPhaseData);
  
  // Calculate percentage changes
  const calculatePercentage = (from: number, to: number) => {
    if (from === 0) return to > 0 ? 100 : 0;
    return parseFloat(((to - from) / from * 100).toFixed(1));
  };
  
  const changes = [
    { 
      metric: "Overall RP Score", 
      from: firstMetrics.avgScore, 
      to: lastMetrics.avgScore, 
      percentage: calculatePercentage(firstMetrics.avgScore, lastMetrics.avgScore) 
    },
    { 
      metric: "High-Risk Metrics", 
      from: firstMetrics.highRiskCount, 
      to: lastMetrics.highRiskCount, 
      percentage: calculatePercentage(firstMetrics.highRiskCount, lastMetrics.highRiskCount) 
    },
    { 
      metric: "Data Completeness", 
      from: firstMetrics.completeness, 
      to: lastMetrics.completeness, 
      percentage: calculatePercentage(firstMetrics.completeness, lastMetrics.completeness) 
    }
  ];
  
  // Generate summary text
  const scoreChange = lastMetrics.avgScore - firstMetrics.avgScore;
  const summary = `Risk perception in ${location} has ${
    scoreChange > 0 ? 'increased' : scoreChange < 0 ? 'decreased' : 'remained stable'
  } ${
    Math.abs(scoreChange) > 1 ? 'significantly' : 'slightly'
  } since the previous phase, with a ${
    Math.abs(changes[0].percentage).toFixed(1)
  }% ${
    scoreChange > 0 ? 'increase' : 'decrease'
  } in overall RP score.`;
  
  return {
    changes,
    summary
  };
};

// Get key metrics for dashboard display from dynamically calculated data
export const getKeyMetrics = (data: any[], location: string = 'HS1') => {
  if (!data || data.length === 0) {
    return {
      riskScore: 0,
      changePercentage: 0,
      trendDirection: 'neutral',
      highRiskAreas: 0,
      dataQuality: 0,
      dataRange: 'No data available'
    };
  }
  
  // Filter data for the specific location
  const locationData = data.filter(row => 
    (row['AO'] === location) || 
    (row['AO Location'] === location) || 
    (row['Area'] === location)
  );
  
  if (locationData.length === 0) {
    return {
      riskScore: 0,
      changePercentage: 0,
      trendDirection: 'neutral',
      highRiskAreas: 0,
      dataQuality: 0,
      dataRange: 'No data available'
    };
  }
  
  // Extract risk scores
  const scores = locationData.map(row => 
    parseFloat(row['Risk Score'] || row['RP Score'] || row['Score'] || '0')
  ).filter(score => !isNaN(score));
  
  const avgScore = scores.length > 0 ? 
    scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  
  // Count high-risk metrics
  const highRiskCount = scores.filter(score => score >= 7).length;
  
  // Calculate data completeness for quality metric
  let completenessSum = 0;
  let fieldsChecked = 0;
  locationData.forEach(row => {
    const keyFields = ['Risk Score', 'RP Score', 'Score', 
                      'Hotspot', 'Metric', 'Metric Name',
                      'Respondent Type', 'Respondent Group',
                      'Phase', 'Likelihood', 'Severity'];
    
    keyFields.forEach(field => {
      const hasValue = Object.keys(row).some(key => 
        key.toLowerCase() === field.toLowerCase() && 
        row[key] !== null && 
        row[key] !== undefined && 
        row[key] !== ''
      );
      
      if (hasValue) completenessSum++;
      fieldsChecked++;
    });
  });
  
  const completeness = fieldsChecked > 0 ? 
    Math.round((completenessSum / fieldsChecked) * 100) : 0;
  
  // Calculate trend and change percentage by comparing phases
  let trendDirection = 'neutral';
  let changePercentage = 0;
  
  const phaseGroups = new Map();
  locationData.forEach(row => {
    const phase = row['Phase'];
    if (phase) {
      const score = parseFloat(row['Risk Score'] || row['RP Score'] || row['Score'] || '0');
      if (!isNaN(score)) {
        if (phaseGroups.has(phase)) {
          phaseGroups.get(phase).push(score);
        } else {
          phaseGroups.set(phase, [score]);
        }
      }
    }
  });
  
  if (phaseGroups.size >= 2) {
    const phases = Array.from(phaseGroups.keys()).sort();
    const firstPhaseAvg = phaseGroups.get(phases[0]).reduce((sum: number, score: number) => sum + score, 0) / 
                         phaseGroups.get(phases[0]).length;
    const lastPhaseAvg = phaseGroups.get(phases[phases.length - 1]).reduce((sum: number, score: number) => sum + score, 0) / 
                        phaseGroups.get(phases[phases.length - 1]).length;
    
    const change = lastPhaseAvg - firstPhaseAvg;
    trendDirection = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
    
    if (firstPhaseAvg !== 0) {
      changePercentage = parseFloat((Math.abs(change) / firstPhaseAvg * 100).toFixed(1));
    } else if (lastPhaseAvg > 0) {
      changePercentage = 100; // From zero to something
    }
  }
  
  // Get data range - look for date fields or use phases
  let dataRange = 'March 2025-May 2025'; // Default fallback
  const dates = locationData
    .map(row => row['Date'] || row['Timeline'] || row['Collection Date'])
    .filter(Boolean);
  
  if (dates.length > 0) {
    const sortedDates = [...dates].sort();
    dataRange = `${sortedDates[0]} - ${sortedDates[sortedDates.length - 1]}`;
  }
  
  return {
    riskScore: parseFloat(avgScore.toFixed(2)),
    changePercentage,
    trendDirection,
    highRiskAreas: highRiskCount,
    dataQuality: completeness,
    dataRange
  };
};
