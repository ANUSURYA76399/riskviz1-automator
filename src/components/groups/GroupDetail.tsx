import { useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { InfoIcon, MapPin } from 'lucide-react';

// Types
type RiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk';

interface MetricData {
  name: string;
  likelihood: number;
  severity: number;
  score: number;
}

interface PhaseMetricData {
  subject: string;
  phase1: number;
  phase2: number;
  phase3: number;
  fullMark: number;
}

interface LocationData {
  location: string;
  criminalNetworks?: number;
  community?: number;
  lawEnforcement?: number;
  government?: number;
  demandCenter?: number;
}

interface GroupDetailProps {
  selectedGroup: string;
  phaseData: PhaseMetricData[];
  metrics: MetricData[];
  locationData: LocationData[];
  averageScore: number;
  colors?: {
    phase1?: string;
    phase2?: string;
    phase3?: string;
    likelihood?: string;
    severity?: string;
  };
  thresholds?: {
    low: number;
    medium: number;
    significant: number;
  };
}

// Utility functions
const getScoreColor = (score: number, thresholds: { low: number; medium: number }) => {
  if (score <= thresholds.low) return '#22c55e';
  if (score <= thresholds.medium) return '#f59e0b';
  return '#ef4444';
};

const getRiskLevel = (score: number, thresholds: { low: number; medium: number }): RiskLevel => {
  if (score <= thresholds.low) return 'Low Risk';
  if (score <= thresholds.medium) return 'Medium Risk';
  return 'High Risk';
};

export const GroupDetail = ({
  selectedGroup,
  phaseData,
  metrics,
  locationData,
  averageScore,
  colors = {
    phase1: '#22c55e',
    phase2: '#f59e0b',
    phase3: '#ef4444',
    likelihood: '#3b82f6',
    severity: '#8b5cf6'
  },
  thresholds = {
    low: 3,
    medium: 6,
    significant: 1.5
  }
}: GroupDetailProps) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'metrics' | 'locations'>('radar');
  
  // Process location data for the selected group
  const processedLocationData = locationData.map(location => ({
    location: location.location,
    score: location[selectedGroup === "Criminal Networks" ? "criminalNetworks" : 
           selectedGroup === "Community Leaders" ? "community" : 
           selectedGroup === "Law Enforcement" ? "lawEnforcement" : 
           selectedGroup === "Government Officials" ? "government" : 
           "demandCenter"] || 0
  }));

  const locationAverage = processedLocationData.reduce((sum, loc) => sum + loc.score, 0) / processedLocationData.length;

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">{selectedGroup} - Overview</h3>
        <p className="text-sm text-gray-600 mb-2">
          Average Risk Score: <span className="font-bold">{averageScore.toFixed(1)}</span>
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getRiskLevel(averageScore, thresholds)}`}>
            {getRiskLevel(averageScore, thresholds)}
          </span>
        </p>
        <p className="text-sm text-gray-600">
          Data collected across all locations, with {metrics.length} key risk metrics tracked over 3 phases.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as any)}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="radar">Phase Comparison</TabsTrigger>
          <TabsTrigger value="metrics">Metric Details</TabsTrigger>
          <TabsTrigger value="locations">Location Breakdown</TabsTrigger>
        </TabsList>
        
        <TabsContent value="radar" className="mt-4">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={phaseData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 9]} />
                <Radar
                  name="Phase 1"
                  dataKey="phase1"
                  stroke={colors.phase1}
                  fill={colors.phase1}
                  fillOpacity={0.2}
                />
                <Radar
                  name="Phase 2"
                  dataKey="phase2"
                  stroke={colors.phase2}
                  fill={colors.phase2}
                  fillOpacity={0.2}
                />
                <Radar
                  name="Phase 3"
                  dataKey="phase3"
                  stroke={colors.phase3}
                  fill={colors.phase3}
                  fillOpacity={0.2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
        
        <TabsContent value="metrics" className="mt-4">
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={metrics}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 9]} />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    return [value, name === "score" ? "Risk Score" : name === "likelihood" ? "Likelihood (1-3)" : "Severity (1-3)"];
                  }}
                />
                <Legend />
                <Bar name="Likelihood (1-3)" dataKey="likelihood" fill={colors.likelihood} />
                <Bar name="Severity (1-3)" dataKey="severity" fill={colors.severity} />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {metrics.map((metric, index) => {
                const isSignificant = Math.abs(metric.score - metrics[0].score) > thresholds.significant;
                
                return (
                  <Card key={index} className="p-4 relative overflow-hidden">
                    {isSignificant && (
                      <div className="absolute top-0 right-0 p-1 bg-yellow-500 rounded-bl-md" title="Significant change">
                        <InfoIcon className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <h3 className="text-sm font-medium">{metric.name}</h3>
                    <div 
                      className="text-2xl font-bold mt-2" 
                      style={{ color: getScoreColor(metric.score, thresholds) }}
                    >
                      {metric.score.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      L({metric.likelihood.toFixed(1)}) × S({metric.severity.toFixed(1)})
                    </div>
                    <div className="text-xs mt-2 font-medium" style={{ color: getScoreColor(metric.score, thresholds) }}>
                      {getRiskLevel(metric.score, thresholds)}
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mt-6">
              <h3 className="font-medium mb-2">Metric Insights</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-red-500">•</span>
                  <span><strong>Highest Risk:</strong> {metrics.sort((a, b) => b.score - a.score)[0].name} ({metrics.sort((a, b) => b.score - a.score)[0].score.toFixed(1)})</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">•</span>
                  <span><strong>Lowest Risk:</strong> {metrics.sort((a, b) => a.score - b.score)[0].name} ({metrics.sort((a, b) => a.score - b.score)[0].score.toFixed(1)})</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-500">•</span>
                  <span><strong>Significant Variation:</strong> {metrics.some(m => Math.abs(m.score - metrics[0].score) > thresholds.significant) ? 'Yes' : 'No'}</span>
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="locations" className="mt-4">
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={processedLocationData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" />
                <YAxis domain={[0, 9]} />
                <Tooltip formatter={(value: any) => [value.toFixed(1), 'Risk Score']} />
                <Legend />
                <Bar 
                  name={`${selectedGroup} Risk Score`}
                  dataKey="score" 
                  fill="#3b82f6"
                >
                  {processedLocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getScoreColor(entry.score, thresholds)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {processedLocationData.map((location, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <h3 className="font-medium">{location.location}</h3>
                  </div>
                  <div 
                    className="text-2xl font-bold" 
                    style={{ color: getScoreColor(location.score, thresholds) }}
                  >
                    {location.score.toFixed(1)}
                  </div>
                  <div className="text-xs mt-1 font-medium" style={{ color: getScoreColor(location.score, thresholds) }}>
                    {getRiskLevel(location.score, thresholds)}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {location.score > locationAverage
                      ? `${(location.score - locationAverage).toFixed(1)} above average`
                      : `${(locationAverage - location.score).toFixed(1)} below average`
                    }
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};