import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label, BarChart, Bar, Cell, ReferenceLine, ComposedChart } from 'recharts';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Data Interfaces
interface MetricData {
  metric: string;
  score: number;
  risk: string;
}

interface RespondentData {
  name: string;
  score: number;
  color: string;
}

interface PhaseData {
  name: string;
  data: RespondentData[];
  threshold: number;
}

interface HeatmapRow {
  respondentGroup: string;
  [key: string]: number | string; // For dynamic hotspot columns
}

interface PhaseComparisonRow {
  name: string;
  [key: string]: number | string; // For dynamic phase columns (PHASE1, PHASE2, etc)
}

interface AOHeatmapData {
  respondentGroup: string;
  [key: string]: number | string; // For dynamic phase columns
}

interface DisruptionData {
  hotspot: number;
  rpScore: number;
  disruption: number;
}

interface TrendLineChartProps {
  // View Mode Controls
  metricView?: boolean;
  phaseView?: boolean;
  heatmapView?: boolean;
  phaseComparisonView?: boolean;
  aoHeatmapView?: boolean;
  disruptionView?: boolean;
  
  // Data
  metricData?: {
    [metric: string]: MetricData[];
  };
  phaseData?: {
    [phase: string]: PhaseData;
  };
  heatmapData?: HeatmapRow[];
  phaseComparisonData?: {
    data: PhaseComparisonRow[];
    hotspots: string[];
  };
  aoData?: {
    [ao: string]: AOHeatmapData[];
  };
  disruptionData?: DisruptionData[];
  
  // Selection States
  selectedHotspots?: string[];
  selectedRespondentGroup?: string;
  selectedPhase?: number;
  selectedMetrics?: string[];
  selectedAO?: string;
  
  // Customization
  colors?: {
    phases?: {
      [phase: string]: string;
    };
    default?: string[];
  };
  thresholds?: {
    low: number;
    moderate: number;
    high: number;
  };
  
  // Callbacks
  onHotspotClick?: (hotspot: string) => void;
  onScoreHover?: (score: number, metric: string) => void;
}

// Utility Components
const YAxisLabel = ({ value, position = 'left', offset = 0 }: {
  value: string;
  position?: string;
  offset?: number;
}) => (
  <text
    x={0}
    y={0}
    dx={position === 'left' ? -40 : 40}
    dy={150}
    textAnchor="middle"
    transform="rotate(-90)"
    style={{ fontSize: '12px', fill: '#666' }}
  >
    {value}
  </text>
);

const TextLabel = ({x, y, value, fill}: {x: number, y: number, value: any, fill?: string}) => (
  <text
    x={x}
    y={y}
    fill={fill || "#666"}
    textAnchor="middle"
    dominantBaseline="middle"
    style={{ fontSize: '12px' }}
  >
    {value}
  </text>
);

const CustomTooltip = ({ active, payload, label, getInterpretation }: any) => {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    const interpretation = getInterpretation ? getInterpretation(score) : `Score: ${score}`;
    
    return (
      <div className="bg-white p-3 border rounded-md shadow-lg">
        <p className="text-sm font-medium">{`${label}: ${score}`}</p>
        <p className="text-xs text-gray-600">{interpretation}</p>
      </div>
    );
  }
  return null;
};

// Custom dot component for the line chart
const CustomizedDot = (props: any) => {
  const { cx, cy, value, index, color } = props;
  
  if (value > 8) {
    return (
      <svg 
        x={cx - 10} 
        y={cy - 10} 
        width={20} 
        height={20} 
        fill={color || "red"} 
        viewBox="0 0 1024 1024"
      >
        <path d="M512 1009.984c-274.912 0-497.76-222.848-497.76-497.76s222.848-497.76 497.76-497.76c274.912 0 497.76 222.848 497.76 497.76s-222.848 497.76-497.76 497.76zM340.768 295.936c-39.488 0-71.52 32.8-71.52 73.248s32.032 73.248 71.52 73.248c39.488 0 71.52-32.8 71.52-73.248s-32.032-73.248-71.52-73.248zM686.176 296.704c-39.488 0-71.52 32.8-71.52 73.248s32.032 73.248 71.52 73.248c39.488 0 71.52-32.8 71.52-73.248s-32.032-73.248-71.52-73.248zM772.928 555.392c-18.752-8.864-40.928-0.576-49.632 18.528-40.224 88.576-120.256 143.552-208.832 143.552-85.952 0-164.864-52.64-205.952-137.376-9.184-18.912-31.648-26.592-50.08-17.28-18.464 9.408-21.216 21.472-15.936 32.64 52.8 111.424 155.232 186.784 269.76 186.784 117.984 0 217.12-70.944 269.76-186.784 8.672-19.136 9.568-31.2-9.12-40.096z" />
      </svg>
    );
  }

  if (value < 3) {
    return (
      <svg 
        x={cx - 10} 
        y={cy - 10} 
        width={20} 
        height={20} 
        fill={color || "red"} 
        viewBox="0 0 1024 1024"
      >
        <path d="M517.12 53.248q95.232 0 179.2 36.352t145.92 98.304 98.304 145.92 36.352 179.2-36.352 179.2-98.304 145.92-145.92 98.304-179.2 36.352-179.2-36.352-145.92-98.304-98.304-145.92-36.352-179.2 36.352-179.2 98.304-145.92 145.92-98.304 179.2-36.352zM663.552 261.12q-15.36 0-28.16 6.656t-23.04 18.432-15.872 27.648-5.632 33.28q0 35.84 21.504 61.44t51.2 25.6 51.2-25.6 21.504-61.44q0-17.408-5.632-33.28t-15.872-27.648-23.04-18.432-28.16-6.656zM373.76 261.12q-29.696 0-50.688 25.088t-20.992 60.928 20.992 61.44 50.688 25.6 50.176-25.6 20.48-61.44-20.48-60.928-50.176-25.088zM520.192 602.112q-51.2 0-97.28 9.728t-82.944 27.648-62.464 41.472-35.84 51.2q-1.024 1.024-1.024 2.048-1.024 3.072-1.024 8.704t2.56 11.776 7.168 11.264 12.8 6.144q25.6-27.648 62.464-50.176 31.744-19.456 79.36-35.328t114.176-15.872q67.584 0 116.736 15.872t81.92 35.328q37.888 22.528 63.488 50.176 17.408-5.12 19.968-18.944t0.512-18.944-3.072-7.168-1.024-3.072q-26.624-29.696-62.976-51.712t-96.256-38.912-129.024-16.896z" />
      </svg>
    );
  }
  
  return (
    <circle 
      cx={cx} 
      cy={cy} 
      r={5} 
      stroke={color || "black"} 
      strokeWidth={1} 
      fill={color || "black"} 
    />
  );
};

export const TrendLineChart = ({
  // View Mode Controls
  metricView = false,
  phaseView = false,
  heatmapView = false,
  phaseComparisonView = false,
  aoHeatmapView = false,
  disruptionView = false,
  
  // Data
  metricData = {},
  phaseData = {},
  heatmapData = [],
  phaseComparisonData = { data: [], hotspots: [] },
  aoData = {},
  disruptionData = [],
  
  // Selection States
  selectedHotspots = [],
  selectedRespondentGroup = '',
  selectedPhase = 1,
  selectedMetrics = [],
  selectedAO = '',
  
  // Customization
  colors = {
    phases: {
      PHASE1: '#3b82f6',
      PHASE2: '#ef4444',
      PHASE3: '#84cc16'
    },
    default: ['#3b82f6', '#ef4444', '#84cc16']
  },
  thresholds = {
    low: 3.0,
    moderate: 5.0,
    high: 7.0
  },
  
  // Callbacks
  onHotspotClick,
  onScoreHover
}: TrendLineChartProps) => {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  
  const toggleSection = (index: number) => {
    if (expandedSection === index) {
      setExpandedSection(null);
    } else {
      setExpandedSection(index);
    }
  };
  
  // Helper function to get risk interpretation based on score
  const getRiskInterpretation = (score: number) => {
    if (score <= thresholds.low) {
      return "Low Risk";
    } else if (score <= thresholds.moderate) {
      return "Moderate Risk";
    } else {
      return "High Risk";
    }
  };
  
  // Helper function to get color based on score
  const getScoreColor = (score: number) => {
    if (score <= thresholds.low) {
      return "#84cc16"; // Green for low risk
    } else if (score <= thresholds.moderate) {
      return "#f59e0b"; // Amber for moderate risk
    } else {
      return "#ef4444"; // Red for high risk
    }
  };
  
  // Function to show the current phase data
  const getCurrentPhaseData = () => {
    const phaseName = `PHASE${selectedPhase}`;
    return phaseData[phaseName] || { name: '', data: [], threshold: 0 };
  };
  
  // Function to handle respondent group bar click in phase view
  const handleRespondentClick = (respondentGroup: string) => {
    console.log(`Clicked on respondent group: ${respondentGroup}`);
    // Additional callback can be added here
  };
  
  // Render the metric view (for comparing metrics)
  if (metricView && selectedMetrics.length > 0) {
    const selectedMetricsData = selectedMetrics.map(metric => {
      const metricScores = metricData[metric] || [];
      
      // Format the data for the chart
      return {
        name: metric,
        data: metricScores.map(item => ({
          name: item.metric,
          score: item.score,
          color: getScoreColor(item.score)
        }))
      };
    });
    
    return (
      <div className="space-y-4">
        {selectedMetricsData.map((metric, index) => (
          <Card key={metric.name} className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">{metric.name}</h3>
              <button
                onClick={() => toggleSection(index)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                {expandedSection === index ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {(expandedSection === index || expandedSection === null) && (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metric.data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      interval={0}
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      ticks={[0, 2, 4, 6, 8, 10]}
                      label={<YAxisLabel value="Risk Score" />}
                    />
                    <Tooltip 
                      content={<CustomTooltip getInterpretation={getRiskInterpretation} />} 
                    />
                    <Legend />
                    <ReferenceLine 
                      y={thresholds.low} 
                      stroke="#84cc16" 
                      strokeDasharray="3 3" 
                      strokeWidth={2}
                      label={{ 
                        value: `Low (${thresholds.low})`, 
                        position: 'right',
                        fill: '#84cc16',
                        fontSize: 12
                      }}
                    />
                    <ReferenceLine 
                      y={thresholds.moderate} 
                      stroke="#f59e0b" 
                      strokeDasharray="3 3"
                      strokeWidth={2}
                      label={{ 
                        value: `Moderate (${thresholds.moderate})`, 
                        position: 'right',
                        fill: '#f59e0b',
                        fontSize: 12
                      }}
                    />
                    <ReferenceLine 
                      y={thresholds.high} 
                      stroke="#ef4444" 
                      strokeDasharray="3 3"
                      strokeWidth={2}
                      label={{ 
                        value: `High (${thresholds.high})`, 
                        position: 'right',
                        fill: '#ef4444',
                        fontSize: 12
                      }}
                    />
                    <Bar 
                      dataKey="score" 
                      name={metric.name}
                      onClick={(data) => onScoreHover && onScoreHover(data.score, data.name)}
                    >
                      {metric.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  }
  
  // Render the phase view (for comparing different phases)
  if (phaseView && Object.keys(phaseData).length > 0) {
    const currentPhaseData = getCurrentPhaseData();
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">
            {currentPhaseData.name || `Phase ${selectedPhase}`}
          </h3>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={currentPhaseData.data}
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  interval={0}
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis 
                  domain={[0, 10]} 
                  ticks={[0, 2, 4, 6, 8, 10]}
                  label={<YAxisLabel value="Risk Score" />}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score">
                  {currentPhaseData.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <ReferenceLine
                  y={currentPhaseData.threshold}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  strokeWidth={2}
                  label={{
                    value: `Threshold (${currentPhaseData.threshold})`,
                    position: 'right',
                    fill: '#f59e0b',
                    fontSize: 12
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {Object.keys(phaseData).map((phaseName, index) => (
            <Card 
              key={phaseName}
              className={`p-2 cursor-pointer hover:shadow-md transition-shadow ${
                `PHASE${selectedPhase}` === phaseName ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => {
                // Add selection logic here if needed
              }}
            >
              <div className="text-center font-medium">
                Phase {index + 1}
              </div>
              <div className="text-center text-sm text-gray-500">
                {phaseData[phaseName].name}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // Render the heatmap view
  if (heatmapView && heatmapData.length > 0) {
    // Extract column names (excluding respondentGroup)
    const hotspots = Object.keys(heatmapData[0]).filter(key => key !== 'respondentGroup');
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Risk Heatmap</h3>
          
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Respondent Group</TableHead>
                  {hotspots.map(hotspot => (
                    <TableHead 
                      key={hotspot}
                      className={`text-center cursor-pointer ${
                        selectedHotspots.includes(hotspot) ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => onHotspotClick && onHotspotClick(hotspot)}
                    >
                      {hotspot}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {heatmapData.map((row, rowIndex) => (
                  <TableRow 
                    key={rowIndex}
                    className={selectedRespondentGroup === row.respondentGroup ? 'bg-blue-50' : ''}
                  >
                    <TableCell className="font-medium">{row.respondentGroup}</TableCell>
                    {hotspots.map(hotspot => {
                      const score = Number(row[hotspot]);
                      return (
                        <TableCell 
                          key={`${rowIndex}-${hotspot}`}
                          className="text-center p-1"
                        >
                          <div 
                            className="rounded-md p-2 text-white font-medium"
                            style={{ 
                              backgroundColor: getScoreColor(score),
                              minWidth: '50px'
                            }}
                          >
                            {score.toFixed(1)}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    );
  }
  
  // Render the phase comparison view
  if (phaseComparisonView && phaseComparisonData.data && phaseComparisonData.data.length > 0) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Phase Comparison</h3>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                data={phaseComparisonData.data}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  label={{ value: 'Hotspots', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  domain={[0, 10]} 
                  ticks={[0, 2, 4, 6, 8, 10]}
                  label={<YAxisLabel value="Risk Score" />}
                />
                <Tooltip />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconSize={30}
                />
                {Object.keys(colors?.phases || {}).map(phase => (
                  <Line 
                    key={phase}
                    type="monotone" 
                    dataKey={phase} 
                    stroke={colors?.phases?.[phase] || '#ccc'} 
                    name={`Phase ${phase.slice(-1)}`} 
                    strokeWidth={3} 
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4">
            <div className="p-2">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Respondent Group</TableHead>
                    {Object.keys(colors?.phases || {}).map(phase => (
                      <TableHead key={phase} className="text-center">
                        {`Phase ${phase.slice(-1)}`}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {phaseComparisonData.data.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      {Object.keys(colors?.phases || {}).map(phase => (
                        <TableCell 
                          key={phase} 
                          className="text-center p-1"
                        >
                          <div 
                            className="rounded-md p-2 text-white font-medium"
                            style={{ 
                              backgroundColor: getScoreColor(Number(row[phase]) || 0),
                              minWidth: '50px'
                            }}
                          >
                            {typeof row[phase] === 'number' ? row[phase].toFixed(1) : '-'}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  // Render the AO heatmap view
  if (aoHeatmapView && selectedAO && aoData[selectedAO]) {
    const aoHeatmapData = aoData[selectedAO] || [];
    const phases = Object.keys(colors?.phases || {});
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">{selectedAO} Heatmap</h3>
          
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Respondent Group</TableHead>
                  {phases.map(phase => (
                    <TableHead key={phase} className="text-center">
                      {`Phase ${phase.slice(-1)}`}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {aoHeatmapData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell className="font-medium">{row.respondentGroup}</TableCell>
                    {phases.map(phase => {
                      const score = Number(row[phase]) || 0;
                      return (
                        <TableCell 
                          key={`${rowIndex}-${phase}`}
                          className="text-center p-1"
                        >
                          <div 
                            className="rounded-md p-2 text-white font-medium"
                            style={{ 
                              backgroundColor: getScoreColor(score),
                              minWidth: '50px'
                            }}
                          >
                            {score.toFixed(1)}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    );
  }
  
  // Render the disruption view
  if (disruptionView && disruptionData.length > 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Comparison between RP scores and Disruption</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={disruptionData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hotspot" />
              <YAxis yAxisId="left" label={<YAxisLabel value="RP Score" />} />
              <YAxis yAxisId="right" orientation="right" label={<YAxisLabel value="Disruption %" />} />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="rpScore"
                fill={colors?.default?.[0] || '#ccc'}
                name="RP Score"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="disruption"
                stroke={colors?.default?.[1] || '#666'}
                name="Disruption %"
                dot={<CustomizedDot />}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-[400px] flex items-center justify-center">
      <p className="text-gray-500">Select a visualization type and provide data</p>
    </div>
  );
};
