
// Helper functions for risk data

/**
 * Determine the risk level based on a score
 */
export const getRiskLevel = (score: number) => {
  if (score <= 3) return { level: 'Low', color: '#22c55e' };
  if (score <= 6) return { level: 'Medium', color: '#f59e0b' };
  return { level: 'High', color: '#ef4444' };
};

/**
 * Generate contextual interpretation guidance for different chart types
 */
export const generateInterpretation = (chartType: string) => {
  const interpretations: { [key: string]: string } = {
    scatter: "This chart shows the relationship between likelihood (x-axis) and severity (y-axis) of different risk metrics. Points in the top-right corner indicate high-priority risks that are both likely and severe. The size of the circle indicates the combined risk score.",
    bar: "This bar chart compares risk perception scores across different stakeholder groups. Higher bars indicate higher perceived risk. You can see how perceptions vary between groups and how they've changed across phases.",
    heatmap: "The heatmap displays risk intensity across different locations and stakeholder groups. Darker colors indicate higher risk perception. Look for patterns across locations and identify which groups consistently report higher or lower risk.",
    trend: "This line chart tracks how risk perception has evolved over time. Rising lines indicate increasing risk perception, which could suggest either growing threats or improved awareness. Compare the slopes to identify which groups are experiencing more rapid changes.",
    combined: "This chart combines risk perception scores (bars) with disruption percentages (line). Look for areas where high risk scores correspond with high disruption, indicating effective intervention targeting.",
  };
  
  return interpretations[chartType] || 
    "This chart helps visualize risk perception data. Look for patterns and outliers that might require attention.";
};
