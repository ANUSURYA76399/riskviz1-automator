
import { riskScoresByPhase } from './riskData';

/**
 * Generate key insights for the dashboard
 */
export const generateInsights = () => {
  const insights = [];
  
  // Find the group with highest data completeness
  const highestCompleteness = [...riskScoresByPhase].sort((a, b) => b.dataCompleteness - a.dataCompleteness)[0];
  if (highestCompleteness.dataCompleteness > 95) {
    insights.push({
      text: `${highestCompleteness.name} shows highest data completeness (${highestCompleteness.dataCompleteness}%)`,
      icon: "CheckCircle",
      color: "text-green-500",
    });
  }
  
  // Find groups with low data completeness
  const lowCompleteness = riskScoresByPhase.filter(group => group.dataCompleteness < 70);
  if (lowCompleteness.length > 0) {
    insights.push({
      text: `${lowCompleteness[0].name} needs attention (${lowCompleteness[0].dataCompleteness}% completeness)`,
      icon: "AlertCircle",
      color: "text-red-500",
    });
  }
  
  // Find biggest improvers
  const improvers = [...riskScoresByPhase].sort((a, b) => (b.dataCompleteness - b.previousCompleteness) - (a.dataCompleteness - a.previousCompleteness));
  if (improvers[0].dataCompleteness > improvers[0].previousCompleteness) {
    insights.push({
      text: `${improvers[0].name} shows most improvement (+${improvers[0].dataCompleteness - improvers[0].previousCompleteness}% completeness)`,
      icon: "TrendingUp",
      color: "text-blue-500",
    });
  }
  
  // Find highest risk group
  const highestRisk = [...riskScoresByPhase].sort((a, b) => b.phase3 - a.phase3)[0];
  insights.push({
    text: `${highestRisk.name} shows highest risk perception (${highestRisk.phase3.toFixed(1)})`,
    icon: "AlertTriangle",
    color: "text-amber-500",
  });
  
  // Find significant trends
  const biggestChange = [...riskScoresByPhase].sort((a, b) => b.trendChange - a.trendChange)[0];
  insights.push({
    text: `${biggestChange.name} experienced the biggest increase in risk (+${biggestChange.trendChange.toFixed(1)} points)`,
    icon: "TrendingUp",
    color: "text-purple-500",
  });
  
  return insights.slice(0, 3); // Return top 3 insights
};

/**
 * Detect anomalies in data completeness
 */
export const detectAnomalies = () => {
  return riskScoresByPhase
    .map(group => {
      const completenessChange = group.dataCompleteness - group.previousCompleteness;
      // Consider a significant change (>10% or <-5%) as an anomaly
      const isAnomaly = completenessChange > 10 || completenessChange < -5;
      return {
        name: group.name,
        completeness: group.dataCompleteness,
        previousCompleteness: group.previousCompleteness,
        change: completenessChange,
        isAnomaly,
        direction: completenessChange > 0 ? 'increase' : 'decrease',
      };
    })
    .filter(group => group.isAnomaly);
};

/**
 * Find focus groups (lowest performing)
 */
export const getFocusGroups = () => {
  return [...riskScoresByPhase]
    .sort((a, b) => a.dataCompleteness - b.dataCompleteness)
    .slice(0, 2) // Get the 2 lowest performing groups
    .map(group => ({
      name: group.name,
      completeness: group.dataCompleteness,
      suggestion: group.dataCompleteness < 70 
        ? 'Urgent attention needed'
        : 'Consider follow-up survey',
    }));
};
