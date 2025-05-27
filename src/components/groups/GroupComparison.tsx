import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp } from 'lucide-react';

// Data Interfaces
interface GroupData {
  name: string;
  fill?: string;
  [key: string]: any; // For dynamic phase data
}

interface PhaseData {
  phase: number;
  score: number;
}

interface ProcessedGroupData {
  name: string;
  fill: string | undefined;
  phase1?: number;
  phase2?: number;
  phase3?: number;
  [key: string]: string | number | undefined;
}

interface GroupComparisonProps {
  // Required Props
  selectedGroups: string[];
  sortBy: 'alphabetical' | 'score';
  showPhaseComparison: boolean;
  
  // Data Props
  data?: GroupData[];
  csvData?: any[];
  
  // Customization Props
  colors?: {
    phase1?: string;
    phase2?: string;
    phase3?: string;
    default?: string;
  };
  barSize?: {
    single: number;
    comparison: number;
  };
  thresholds?: {
    low: number;
    medium: number;
    high: number;
  };
  
  // Callbacks
  onDataProcessed?: (data: ProcessedGroupData[]) => void;
  onError?: (error: Error) => void;
}

const CustomBar = (props: any) => {
  const { x, y, width, height, fill } = props;
  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} />;
};

export const GroupComparison = ({ 
  // Required Props
  selectedGroups, 
  sortBy, 
  showPhaseComparison,
  
  // Data Props
  data = [],
  csvData = [],
  
  // Customization Props
  colors = {
    phase1: '#22c55e',
    phase2: '#f59e0b',
    phase3: '#ef4444',
    default: '#3b82f6'
  },
  barSize = {
    single: 40,
    comparison: 15
  },
  thresholds = {
    low: 3,
    medium: 6,
    high: 9
  },
  
  // Callbacks
  onDataProcessed,
  onError
}: GroupComparisonProps) => {
  const [processedData, setProcessedData] = useState<ProcessedGroupData[]>([]);

  useEffect(() => {
    if (selectedGroups.length === 0) return;

    try {
      let groupData: ProcessedGroupData[] = [];

      // Use provided data if available
      if (data.length > 0) {
        groupData = data
          .filter(item => selectedGroups.includes(item.name))
          .map(item => ({
            name: item.name,
            fill: item.fill || colors.default,
            phase1: item.phase1 || 0,
            phase2: item.phase2 || 0,
            phase3: item.phase3 || 0
          }));
      }
      // Process CSV data if available and no direct data provided
      else if (csvData.length > 0) {
        groupData = processCSVData(csvData, selectedGroups);
      }

      // Sort the data
      const sortedData = sortData(groupData, sortBy);
      
      setProcessedData(sortedData);
      onDataProcessed?.(sortedData);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [selectedGroups, sortBy, data, csvData]);

  const processCSVData = (rawData: any[], groups: string[]): ProcessedGroupData[] => {
    const groupMap = new Map<string, Map<number, number[]>>();
    
    rawData.forEach(row => {
      const group = row['Respondent Group'] || row['Respondent Type'] || row['RespondentGroup'];
      const phase = parseInt(row['Phase'] || '1');
      const score = parseFloat(row['Risk Score'] || row['RP Score'] || row['Score'] || '0');
      
      if (group && (groups.length === 0 || groups.includes(group)) && !isNaN(phase) && !isNaN(score)) {
        if (!groupMap.has(group)) {
          groupMap.set(group, new Map<number, number[]>());
        }
        
        const phaseMap = groupMap.get(group)!;
        if (!phaseMap.has(phase)) {
          phaseMap.set(phase, []);
        }
        
        phaseMap.get(phase)!.push(score);
      }
    });

    return Array.from(groupMap.entries()).map(([groupName, phaseMap]) => {
      const groupData: ProcessedGroupData = {
        name: groupName,
        fill: colors.default,
        phase1: 0,
        phase2: 0,
        phase3: 0
      };

      phaseMap.forEach((scores, phase) => {
        if (scores.length > 0) {
          const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          groupData[`phase${phase}`] = parseFloat(avgScore.toFixed(2));
        }
      });

      return groupData;
    });
  };

  const sortData = (data: ProcessedGroupData[], sortType: 'alphabetical' | 'score'): ProcessedGroupData[] => {
    return [...data].sort((a, b) => {
      if (sortType === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      const aLatest = Math.max(a.phase1 ?? 0, a.phase2 ?? 0, a.phase3 ?? 0);
      const bLatest = Math.max(b.phase1 ?? 0, b.phase2 ?? 0, b.phase3 ?? 0);
      return bLatest - aLatest;
    });
  };

  const getTrendDirection = (item: ProcessedGroupData): 'up' | 'down' | 'stable' => {
    if ((item.phase3 ?? 0) > 0 && (item.phase2 ?? 0) > 0) {
      return (item.phase3 ?? 0) > (item.phase2 ?? 0) ? 'up' : (item.phase3 ?? 0) < (item.phase2 ?? 0) ? 'down' : 'stable';
    }
    if ((item.phase2 ?? 0) > 0 && (item.phase1 ?? 0) > 0) {
      return (item.phase2 ?? 0) > (item.phase1 ?? 0) ? 'up' : (item.phase2 ?? 0) < (item.phase1 ?? 0) ? 'down' : 'stable';
    }
    return 'stable';
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable'): string => {
    switch(trend) {
      case 'up': return colors.phase3 || '#ef4444';
      case 'down': return colors.phase1 || '#22c55e';
      default: return '#64748b';
    }
  };

  const getLatestPhaseValue = (item: ProcessedGroupData): number => {
    if ((item.phase3 ?? 0) > 0) return item.phase3 ?? 0;
    if ((item.phase2 ?? 0) > 0) return item.phase2 ?? 0;
    return item.phase1 ?? 0;
  };

  const getRiskLevel = (value: number): string => {
    if (value <= thresholds.low) return 'Low';
    if (value <= thresholds.medium) return 'Medium';
    return 'High';
  };

  if (selectedGroups.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Please select at least one group for comparison</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-2 bg-gray-50 rounded-md mb-2">
        <p className="text-sm text-gray-600">
          {showPhaseComparison 
            ? "Showing phase comparison for selected groups. Each group has bars for all available phases." 
            : "Showing latest phase scores for selected groups. Toggle 'Show Phase Comparison' to see trends."}
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={processedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 70,
          }}
          barSize={showPhaseComparison ? barSize.comparison : barSize.single}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={80} 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[0, thresholds.high]} 
            label={{ value: 'Risk Perception Score', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              const phase = name.replace('phase', 'Phase ');
              return [`${value.toFixed(1)} (${getRiskLevel(value)})`, phase];
            }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Legend />
          
          {showPhaseComparison ? (
            <>
              {processedData.length > 0 && processedData[0].phase1 !== undefined && (
                <Bar 
                  dataKey="phase1" 
                  name="Phase 1" 
                  fill={colors.phase1} 
                  shape={<CustomBar />}
                />
              )}
              {processedData.length > 0 && processedData[0].phase2 !== undefined && (
                <Bar 
                  dataKey="phase2" 
                  name="Phase 2" 
                  fill={colors.phase2} 
                  shape={<CustomBar />}
                />
              )}
              {processedData.length > 0 && processedData[0].phase3 !== undefined && (
                <Bar 
                  dataKey="phase3" 
                  name="Phase 3" 
                  fill={colors.phase3} 
                  shape={<CustomBar />}
                />
              )}
            </>
          ) : (
            <Bar 
              dataKey={getLatestPhaseValue}
              name="Current Phase" 
              fill={colors.default}
              shape={<CustomBar />}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {processedData.map((group, index) => {
          const trend = getTrendDirection(group);
          const trendColor = getTrendColor(trend);
          const latestValue = getLatestPhaseValue(group);
          
          return (
            <div key={index} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: group.fill }}
                  />
                  <span className="ml-2 text-sm font-medium truncate">{group.name}</span>
                </div>
                {trend === 'up' ? (
                  <TrendingUp size={16} className="text-red-500" />
                ) : trend === 'down' ? (
                  <TrendingDown size={16} className="text-green-500" />
                ) : null}
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{latestValue.toFixed(1)}</div>
                <div className="text-xs text-gray-500">{getRiskLevel(latestValue)} Risk</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};