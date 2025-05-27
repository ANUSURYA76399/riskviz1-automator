
import { riskScoresByPhase } from './riskData';
/**
 * Generate group comparison insights
 */
export const generateGroupComparisonInsights = (groupNames: string[]) => {
  if (groupNames.length < 2) {
    return [
      {
        text: "Select multiple groups to see comparison insights",
        icon: "Info",
        color: "text-blue-500",
      }
    ];
  }
  
  const insights = [];
  
  // Find selected groups
  const selectedGroups = riskScoresByPhase.filter(group => 
    groupNames.includes(group.name)
  );
  
  // Find similar patterns
  if (selectedGroups.length >= 2) {
    const group1 = selectedGroups[0];
    const group2 = selectedGroups[1];
    
    const patternSimilarity = 1 - Math.abs(
      (group1.phase3 - group1.phase1) - (group2.phase3 - group2.phase1)
    ) / 10; // Calculate a similarity score (0-1)
    
    if (patternSimilarity > 0.7) {
      insights.push({
        text: `${group1.name} and ${group2.name} show similar trend patterns (${(patternSimilarity * 100).toFixed(0)}% match)`,
        icon: "Check",
        color: "text-green-500",
        confidence: "High",
      });
    }
  }
  
  // Find biggest difference in current phase
  if (selectedGroups.length >= 2) {
    const sortedByPhase3 = [...selectedGroups].sort((a, b) => b.phase3 - a.phase3);
    const difference = sortedByPhase3[0].phase3 - sortedByPhase3[sortedByPhase3.length - 1].phase3;
    
    insights.push({
      text: `${sortedByPhase3[0].name} scores ${difference.toFixed(1)} points higher than ${sortedByPhase3[sortedByPhase3.length - 1].name}`,
      icon: "ArrowUpRight",
      color: "text-purple-500",
      confidence: difference > 3 ? "High" : "Medium",
    });
  }
  
  // Find suggested action based on completeness
  const lowestCompleteness = [...selectedGroups].sort((a, b) => a.dataCompleteness - b.dataCompleteness)[0];
  
  insights.push({
    text: `${lowestCompleteness.name} has ${lowestCompleteness.dataCompleteness}% data completeness - collect more data`,
    icon: "AlertCircle",
    color: "text-amber-500",
    confidence: "Medium",
  });
  
  return insights;
};

/**
 * Generate action recommendations for groups
 */
export const generateGroupRecommendations = (groupName: string) => {
  const group = riskScoresByPhase.find(g => g.name === groupName);
  if (!group) return [];
  
  const recommendations = [];
  
  // Completeness-based recommendation
  if (group.dataCompleteness < 80) {
    recommendations.push({
      text: "Conduct follow-up surveys to improve data completeness",
      rationale: `Current completeness is only ${group.dataCompleteness}%`,
      priority: "High",
    });
  }
  
  // Trend-based recommendation
  if (group.phase3 - group.phase2 > 1.5) {
    recommendations.push({
      text: "Investigate causes for rapid increase in risk perception",
      rationale: `Risk increased by ${(group.phase3 - group.phase2).toFixed(1)} points in latest phase`,
      priority: "High",
    });
  } else if (group.phase3 - group.phase2 < -1.0) {
    recommendations.push({
      text: "Document successful interventions that may have reduced risk",
      rationale: `Risk decreased by ${Math.abs(group.phase3 - group.phase2).toFixed(1)} points in latest phase`,
      priority: "Medium",
    });
  }
  
  // Risk level-based recommendation
  if (group.phase3 > 6) {
    recommendations.push({
      text: "Develop targeted risk mitigation strategy",
      rationale: `Current risk level is High (${group.phase3.toFixed(1)})`,
      priority: "High",
    });
  } else if (group.phase3 > 3) {
    recommendations.push({
      text: "Monitor closely and prepare contingency plans",
      rationale: `Current risk level is Medium (${group.phase3.toFixed(1)})`,
      priority: "Medium",
    });
  }
  
  // Add more contextual recommendations based on group type
  if (group.name === 'Criminal Networks') {
    recommendations.push({
      text: "Enhance intelligence gathering and information sharing",
      rationale: "Critical for understanding evolving criminal networks",
      priority: "High",
    });
  } else if (group.name === 'Government') {
    recommendations.push({
      text: "Improve risk awareness training for officials",
      rationale: "Current risk perception is significantly lower than other groups",
      priority: "Medium",
    });
  }
  
  return recommendations;
};
