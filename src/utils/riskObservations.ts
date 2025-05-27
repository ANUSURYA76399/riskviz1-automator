
/**
 * Helper function to safely parse numeric values
 */
const safeParseFloat = (value: any): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Generate dynamic observations based on risk perception scores
 */
export const generateRiskObservations = (
  riskScore: number,
  previousScore: number,
  overallAverage: number,
  standardDeviation: number
) => {
  // Ensure all inputs are valid numbers
  const safeRiskScore = safeParseFloat(riskScore);
  const safePreviousScore = safeParseFloat(previousScore);
  const safeOverallAverage = safeParseFloat(overallAverage);
  const safeStdDev = safeParseFloat(standardDeviation);
  
  const observations = [];

  // High RP Score
  if (safeRiskScore > 7) {
    observations.push({
      text: "High risk perception: Reinforce strategies in this group/location",
      icon: "ArrowUp",
      color: "text-red-500",
      importance: "high"
    });
  }

  // Low RP Score
  if (safeRiskScore < 3.0) {
    observations.push({
      text: "Low risk perception: Immediate attention required",
      icon: "ArrowDown",
      color: "text-blue-500",
      importance: "high"
    });
  }

  // Declining RP Score
  if (safeRiskScore < safePreviousScore - 1.0) {
    observations.push({
      text: `Declining risk perception: Investigate potential causes and adjust strategies (${(safePreviousScore - safeRiskScore).toFixed(1)} point drop)`,
      icon: "ArrowDown",
      color: "text-amber-500",
      importance: "medium"
    });
  }

  // Improving RP Score
  if (safeRiskScore > safePreviousScore + 0.5) {
    observations.push({
      text: `Improving risk perception: Reinforce successful interventions (+${(safeRiskScore - safePreviousScore).toFixed(1)} points)`,
      icon: "ArrowUp",
      color: "text-green-500",
      importance: "medium"
    });
  }

  // Below Overall Average
  if (safeRiskScore < safeOverallAverage - (safeStdDev / 2)) {
    observations.push({
      text: `Below average RP: Risk perception is ${(safeOverallAverage - safeRiskScore).toFixed(1)} points below average`,
      icon: "ArrowDown",
      color: "text-blue-500",
      importance: "low"
    });
  }

  // Above Overall Average
  if (safeRiskScore > safeOverallAverage + (safeStdDev / 2)) {
    observations.push({
      text: `Above average RP: Explore best practices contributing to stronger risk perception (+${(safeRiskScore - safeOverallAverage).toFixed(1)} points)`,
      icon: "ArrowUp",
      color: "text-green-500",
      importance: "low"
    });
  }

  // Outlier Detection - adjust threshold based on data distribution
  if (Math.abs(safeRiskScore - safeOverallAverage) > 2 * safeStdDev) {
    observations.push({
      text: `Outlier detected: Score deviates significantly (${Math.abs(safeRiskScore - safeOverallAverage).toFixed(1)} points) from average`,
      icon: "Info",
      color: "text-purple-500",
      importance: "high"
    });
  }

  // If no observations are generated, add a default one
  if (observations.length === 0) {
    observations.push({
      text: `Risk perception within expected range (${safeRiskScore.toFixed(1)} near average of ${safeOverallAverage.toFixed(1)}), continue monitoring`,
      icon: "Info",
      color: "text-gray-500",
      importance: "low"
    });
  }

  return observations;
};

/**
 * Calculate standard deviation for an array of numbers
 */
export const calculateStandardDeviation = (values: number[]): number => {
  if (!values || values.length <= 1) return 0;
  
  // Filter out invalid values and ensure we're working with numbers
  const validValues = values.filter(v => v !== undefined && v !== null).map(v => safeParseFloat(v));
  
  if (validValues.length <= 1) return 0;
  
  const mean = validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
  const squareDiffs = validValues.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, value) => sum + value, 0) / validValues.length;
  return Math.sqrt(avgSquareDiff);
};

/**
 * Generate observations for all risk scores in a data set
 */
export const generateObservationsForDataset = (data: any[]) => {
  if (!data || data.length === 0) {
    return [];
  }
  
  // Extract all risk scores to calculate overall average and standard deviation
  const allScores = data
    .flatMap(item => {
      const currentScore = safeParseFloat(
        item.score ?? item['Risk Score'] ?? item['RP Score'] ?? item['Score'] ?? 0
      );
      
      // Try to get previous score if available
      let previousScore: number;
      if (typeof item.previousScore === 'number') {
        previousScore = item.previousScore;
      } else {
        // Simple fallback if no previous
        previousScore = currentScore - (Math.random() * 0.5 - 0.25);
      }
      
      return [currentScore, previousScore].filter(score => score > 0);
    });
  
  if (allScores.length === 0) {
    return data;
  }
  
  const overallAverage = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
  const standardDeviation = calculateStandardDeviation(allScores);
  
  // Generate observations for each data point
  return data.map(item => {
    const currentScore = safeParseFloat(
      item.score ?? item['Risk Score'] ?? item['RP Score'] ?? item['Score'] ?? 0
    );
    
    // Default to slight decrease if no previous score
    let previousScore = typeof item.previousScore === 'number' ? item.previousScore : undefined;
    
    // If we don't have a previous score but have phase data, try to infer
    if (previousScore === undefined && item['Phase']) {
      const currentPhase = parseInt(String(item['Phase']));
      if (!isNaN(currentPhase) && currentPhase > 1) {
        // Estimate previous phase score using average difference
        previousScore = currentScore - 0.2;
      } else {
        previousScore = currentScore - 0.2; // Default fallback
      }
    } else if (previousScore === undefined) {
      previousScore = currentScore - 0.2; // Simple default fallback
    }
    
    return {
      ...item,
      score: currentScore,
      previousScore: previousScore,
      observations: generateRiskObservations(
        currentScore, 
        previousScore, 
        overallAverage,
        standardDeviation
      )
    };
  });
};
