
// Risk level calculation and utility functions

// Helper to safely parse numerical values
const safeParseFloat = (value: any): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
};

// Calculate risk score based on likelihood and severity
export const calculateRiskScore = (likelihood: number, severity: number): number => {
  // Normalize inputs to ensure they're in the correct range
  const normalizedLikelihood = Math.min(5, Math.max(1, safeParseFloat(likelihood)));
  const normalizedSeverity = Math.min(5, Math.max(1, safeParseFloat(severity)));
  
  // Simple multiplication to get score in 1-9 range
  const score = normalizedLikelihood * normalizedSeverity / (25/9); // scale to 1-9 range
  
  // Ensure score is between 1-9 and rounded to 1 decimal place
  return Math.min(9, Math.max(1, Math.round(score * 10) / 10));
};

// Interpret risk perception score
export const interpretRPScore = (score: number): string => {
  const safeScore = safeParseFloat(score);
  if (safeScore >= 7) return 'High Risk';
  if (safeScore >= 4) return 'Moderate Risk';
  return 'Low Risk';
};

// Generate recommendation based on risk perception score
export const generateRPRecommendation = (score: number): string => {
  const safeScore = safeParseFloat(score);
  
  if (safeScore >= 7) {
    return 'Immediate action required. Allocate resources to address this high-risk area.';
  }
  if (safeScore >= 4) {
    return 'Monitor closely and develop mitigation strategies for this moderate-risk area.';
  }
  return 'Continue standard monitoring for this low-risk area.';
};

// Generate observation for hotspot
export const generateHotspotObservation = (hotspot: string, score: number, phase: number): string => {
  const safeScore = safeParseFloat(score);
  const riskLevel = interpretRPScore(safeScore).split(' ')[0].toLowerCase();
  return `${hotspot} shows ${riskLevel} risk perception (${safeScore.toFixed(2)}) in Phase ${phase}.`;
};

// Count risk levels in a dataset
export const countRiskLevels = (data: any[]): { low: number, moderate: number, high: number } => {
  const counts = {
    low: 0,
    moderate: 0,
    high: 0
  };
  
  data.forEach(item => {
    let score: number;
    
    // Try multiple possible score field names
    if (typeof item.score === 'number') {
      score = item.score;
    } else if (item['Risk Score'] !== undefined) {
      score = safeParseFloat(item['Risk Score']);
    } else if (item['RP Score'] !== undefined) {
      score = safeParseFloat(item['RP Score']);
    } else if (item['Score'] !== undefined) {
      score = safeParseFloat(item['Score']);
    } else {
      score = 0;
    }
    
    if (score >= 7) {
      counts.high++;
    } else if (score >= 4) {
      counts.moderate++;
    } else if (score > 0) {
      counts.low++;
    }
  });
  
  return counts;
};

// Get appropriate color based on risk score (1-9 scale) or risk level string
export const getRiskLevelColor = (scoreOrLevel: number | string): string => {
  // Handle string risk levels
  if (typeof scoreOrLevel === 'string') {
    const level = scoreOrLevel.toLowerCase();
    if (level === 'low' || level.includes('low')) return '#90EE90'; // Light green
    if (level === 'moderate' || level.includes('moderate') || level.includes('medium')) return '#FFB347'; // Light orange
    if (level === 'high' || level.includes('high')) return '#FF6347'; // Darker orange-red
    return '#006400'; // Default dark green
  }
  
  // Handle numeric scores
  const score = safeParseFloat(scoreOrLevel);
  if (score < 1) return '#006400'; // Default dark green for invalid values
  if (score < 2) return '#006400'; // Dark green
  if (score < 3) return '#90EE90'; // Light green
  if (score < 4) return '#C1FFC1'; // Very light green
  if (score < 5) return '#FFFFE0'; // Light yellow
  if (score < 6) return '#FFB347'; // Light orange
  if (score < 7) return '#FFA07A'; // Light red
  if (score < 8) return '#FF6347'; // Darker orange-red
  if (score < 9) return '#8B0000'; // Dark red
  return '#8B0000'; // Dark red for 9 and above
};

// Get risk level category
export const getRiskLevel = (score: number): 'low' | 'moderate' | 'high' => {
  const safeScore = safeParseFloat(score);
  if (safeScore >= 7) return 'high';
  if (safeScore >= 4) return 'moderate';
  return 'low';
};

// Format data range - dynamically from data if possible
export const getDataRangeText = (data?: any[]): string => {
  if (!data || data.length === 0) {
    return 'March 2025-May 2025'; // Default fallback when no data
  }
  
  const dates = data
    .map(row => row['Date'] || row['Timeline'] || row['Collection Date'])
    .filter(Boolean);
  
  if (dates.length > 0) {
    const sortedDates = [...dates].sort();
    return `${sortedDates[0]} - ${sortedDates[sortedDates.length - 1]}`;
  }
  
  return 'March 2025-May 2025'; // Default fallback
};

// Generate risk matrix data
export const generateRiskMatrix = (data: any[] = []) => {
  // Generate matrix for likelihood vs severity with count/score in each cell
  const matrix = Array(5).fill(0).map(() => Array(5).fill(0).map(() => ({ count: 0, avgScore: 0, total: 0 })));
  
  data.forEach(item => {
    const likelihood = safeParseFloat(item.likelihood || item['Likelihood'] || 0);
    const severity = safeParseFloat(item.severity || item['Severity'] || 0);
    
    if (likelihood > 0 && severity > 0) {
      const l = Math.min(Math.max(Math.floor(likelihood), 1), 5) - 1;
      const s = Math.min(Math.max(Math.floor(severity), 1), 5) - 1;
      
      const score = safeParseFloat(item.score || item['Risk Score'] || item['RP Score'] || item['Score'] || 0);
      
      matrix[l][s].count += 1;
      matrix[l][s].total += score;
      matrix[l][s].avgScore = matrix[l][s].total / matrix[l][s].count;
    }
  });
  
  return matrix;
};
