
import { DetailedMetric, RiskScore } from "@/hooks/use-risk-data";

type InsightType = {
  text: string;
  importance: 'high' | 'medium' | 'low';
};

export function generateInsightsFromData(
  detailedMetrics: DetailedMetric[],
  riskScores: RiskScore[]
): InsightType[] {
  const insights: InsightType[] = [];
  
  if (detailedMetrics.length === 0 && riskScores.length === 0) {
    return [{ 
      text: "No data available for analysis. Try adjusting your filters or upload more data.", 
      importance: 'medium' 
    }];
  }

  // Insight 1: Highest risk metrics
  if (detailedMetrics.length > 0) {
    const sortedByScore = [...detailedMetrics].sort((a, b) => {
      const scoreA = typeof a.score === 'number' ? a.score : parseFloat(String(a.score) || '0');
      const scoreB = typeof b.score === 'number' ? b.score : parseFloat(String(b.score) || '0');
      return scoreB - scoreA;
    });
    
    const highestMetric = sortedByScore[0];
    
    if (highestMetric) {
      const score = typeof highestMetric.score === 'number' ? 
        highestMetric.score : parseFloat(String(highestMetric.score) || '0');
        
      insights.push({
        text: `${highestMetric.metric_name} has the highest risk score (${score.toFixed(1)}) ${highestMetric.hotspot_name ? `in ${highestMetric.hotspot_name}` : ''}.`,
        importance: score >= 7 ? 'high' : 'medium'
      });
    }
  }

  // Insight 2: Trend analysis across phases
  if (riskScores.length > 0) {
    const phases = [...new Set(riskScores.map(rs => rs.phase))].sort();
    if (phases.length > 1) {
      const phaseData = phases.map(phase => {
        const phaseScores = riskScores.filter(rs => rs.phase === phase);
        const scores = phaseScores.map(rs => {
          return typeof rs.score === 'number' ? rs.score : parseFloat(String(rs.score) || '0');
        });
        
        const sum = scores.reduce((acc, score) => acc + score, 0);
        return {
          phase,
          avgScore: scores.length > 0 ? sum / scores.length : 0
        };
      });
      
      const firstPhase = phaseData[0];
      const lastPhase = phaseData[phaseData.length - 1];
      const change = lastPhase.avgScore - firstPhase.avgScore;
      
      insights.push({
        text: `Overall risk ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)} from Phase ${firstPhase.phase} to Phase ${lastPhase.phase}.`,
        importance: Math.abs(change) > 1 ? 'high' : 'medium'
      });
    }
  }

  // Insight 3: Comparison between respondent groups
  if (detailedMetrics.length > 0) {
    const groups = [...new Set(detailedMetrics.map(m => m.respondent_type))];
    if (groups.length > 1) {
      const groupData = groups.map(group => {
        const groupMetrics = detailedMetrics.filter(m => m.respondent_type === group);
        const scores = groupMetrics.map(m => {
          return typeof m.score === 'number' ? m.score : parseFloat(String(m.score) || '0');
        });
        
        const sum = scores.reduce((acc, score) => acc + score, 0);
        return {
          group,
          avgScore: scores.length > 0 ? sum / scores.length : 0
        };
      }).sort((a, b) => b.avgScore - a.avgScore);
      
      const highestGroup = groupData[0];
      const lowestGroup = groupData[groupData.length - 1];
      
      insights.push({
        text: `${highestGroup.group} perceives the highest risk (avg: ${highestGroup.avgScore.toFixed(1)}), while ${lowestGroup.group} has the lowest perception (avg: ${lowestGroup.avgScore.toFixed(1)}).`,
        importance: (highestGroup.avgScore - lowestGroup.avgScore) > 2 ? 'high' : 'medium'
      });
    }
  }
  
  // Insight 4: Location comparison
  if (detailedMetrics.length > 0) {
    const locations = [...new Set(detailedMetrics.map(m => m.ao_name).filter(Boolean))];
    if (locations.length > 1) {
      const locationData = locations.map(loc => {
        const locMetrics = detailedMetrics.filter(m => m.ao_name === loc);
        const scores = locMetrics.map(m => {
          return typeof m.score === 'number' ? m.score : parseFloat(String(m.score) || '0');
        });
        
        const sum = scores.reduce((acc, score) => acc + score, 0);
        return {
          location: loc,
          avgScore: scores.length > 0 ? sum / scores.length : 0
        };
      }).sort((a, b) => b.avgScore - a.avgScore);
      
      const highestLoc = locationData[0];
      
      insights.push({
        text: `${highestLoc.location} shows the highest average risk score (${highestLoc.avgScore.toFixed(1)}) among all areas of operation.`,
        importance: highestLoc.avgScore >= 7 ? 'high' : 'medium'
      });
    }
  }
  
  // Insight 5: Risk severity vs likelihood analysis
  if (detailedMetrics.length > 0) {
    const highSeverityLowLikelihood = detailedMetrics.filter(m => {
      const severity = typeof m.severity === 'number' ? m.severity : parseFloat(String(m.severity) || '0');
      const likelihood = typeof m.likelihood === 'number' ? m.likelihood : parseFloat(String(m.likelihood) || '0');
      return severity > 3.5 && likelihood < 2.5;
    });
    
    if (highSeverityLowLikelihood.length > 0) {
      insights.push({
        text: `Found ${highSeverityLowLikelihood.length} high-severity but low-likelihood risks that may need contingency planning.`,
        importance: highSeverityLowLikelihood.length > 3 ? 'medium' : 'low'
      });
    }
    
    const highLikelihoodHighSeverity = detailedMetrics.filter(m => {
      const severity = typeof m.severity === 'number' ? m.severity : parseFloat(String(m.severity) || '0');
      const likelihood = typeof m.likelihood === 'number' ? m.likelihood : parseFloat(String(m.likelihood) || '0');
      return likelihood > 3.5 && severity > 3.5;
    });
    
    if (highLikelihoodHighSeverity.length > 0) {
      insights.push({
        text: `${highLikelihoodHighSeverity.length} metrics show both high likelihood and high severity, requiring immediate attention.`,
        importance: 'high'
      });
    }
  }

  return insights.slice(0, 5); // Return top 5 insights
}
