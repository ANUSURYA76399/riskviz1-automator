
import { riskScoresByLocation } from './riskData';

/**
 * Generate location-specific insights
 */
export const generateLocationInsights = (location: string) => {
  // Find location data
  const locationData = riskScoresByLocation.find(loc => loc.location === location);
  
  if (!locationData) {
    return [
      {
        text: "Select a location to see specific insights",
        icon: "Info",
        color: "text-blue-500",
      }
    ];
  }
  
  const insights = [];
  
  // Identify highest risk group in this location
  const highestGroup = Object.entries(locationData)
    .filter(([key]) => key !== 'location' && key !== 'overallScore')
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];
  
  const groupName = highestGroup[0].replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  
  insights.push({
    text: `${groupName} reports highest risk perception (${highestGroup[1]})`,
    icon: "AlertTriangle",
    color: "text-red-500",
  });
  
  // Compare to average
  const avgOverallScore = riskScoresByLocation.reduce((sum, loc) => sum + loc.overallScore, 0) / riskScoresByLocation.length;
  const difference = locationData.overallScore - avgOverallScore;
  
  insights.push({
    text: `${Math.abs(difference) < 0.3 ? 'Similar to' : difference > 0 ? 'Higher than' : 'Lower than'} average (${difference > 0 ? '+' : ''}${difference.toFixed(1)} points)`,
    icon: difference > 0 ? "TrendingUp" : difference < 0 ? "ArrowDownRight" : "Info",
    color: difference > 0 ? "text-amber-500" : difference < 0 ? "text-green-500" : "text-blue-500",
  });
  
  // Location-specific recommendation
  if (location === 'Mumbai') {
    insights.push({
      text: `Focus on Dharavi area which shows highest risk score (8.1)`,
      icon: "Info",
      color: "text-blue-500",
    });
  } else {
    insights.push({
      text: `Focus on improving awareness in Government group (${locationData.government.toFixed(1)})`,
      icon: "Info",
      color: "text-blue-500",
    });
  }
  
  return insights;
};
