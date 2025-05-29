import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Brain, X, ArrowLeft, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DataTable } from "@/components/visualize/DataTable";
// import { RiskHeatmapTable } from '@/components/charts/RiskHeatmapTable'; // REMOVE THIS LINE
import { generateRiskObservations, calculateStandardDeviation } from '@/utils/riskObservations';

interface RespondentGroupData {
  name: string;
  phase1: number;
  phase2: number;
  phase3: number;
  threshold?: number;
}

interface HotspotData {
  hotspot: string;
  phase1: number;
  phase2: number;
  phase3: number;
  threshold?: number;
}

interface CombinedRPDisruptionData {
  hotspot: string;
  rpScore: number;
  disruption: number;
}

interface HotspotDetails {
  id: string;
  name: string;
  phase1: number;
  phase2: number;
  phase3: number;
  change?: number;
}

interface AOOverviewProps {
  locations?: string[];
  phases?: string[];
  hotspots?: string[];
  respondentGroups?: string[];
  timelines?: string[];
  respondentData?: RespondentGroupData[];
  hotspotData?: HotspotData[];
  combinedData?: CombinedRPDisruptionData[];
  hotspotDetails?: HotspotDetails[];
  defaultLocation?: string;
  defaultPhases?: string[];
  defaultHotspots?: string[];
  defaultRespondentGroups?: string[];
  defaultTimeline?: string;
  thresholdValue?: number;
}

const interpretRPScore = (score: number) => {
  if (score >= 6) return "High Risk Perception";
  if (score >= 3) return "Medium Risk Perception";
  return "Low Risk Perception";
};

const AOOverview = ({
  locations = ['Location 1', 'Location 2', 'Location 3'],
  phases = ['1', '2', '3'],
  hotspots = ['HS1', 'HS2', 'HS3'],
  respondentGroups = ['Group 1', 'Group 2', 'Group 3'],
  timelines = ['3 months', '6 months', '9 months', '12 months'],
  respondentData = [],
  hotspotData = [],
  combinedData = [],
  hotspotDetails = [],
  defaultLocation = '',
  defaultPhases = ['1', '2', '3'],
  defaultHotspots = [],
  defaultRespondentGroups = [],
  defaultTimeline = '3 months',
  thresholdValue = 3
}: AOOverviewProps) => {
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation || locations[0]);
  const [selectedPhases, setSelectedPhases] = useState<string[]>(defaultPhases.length ? defaultPhases : phases);
  const [selectedHotspots, setSelectedHotspots] = useState<string[]>(defaultHotspots.length ? defaultHotspots : hotspots);
  const [selectedRespondentGroups, setSelectedRespondentGroups] = useState<string[]>(
    defaultRespondentGroups.length ? defaultRespondentGroups : respondentGroups
  );
  const [selectedTimeline, setSelectedTimeline] = useState(defaultTimeline);
  const [showThresholdLine, setShowThresholdLine] = useState(true);
  const [showDataTable, setShowDataTable] = useState(false);
  const [activeTab, setActiveTab] = useState('rp-respondent');
  
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const [comparePopupInfo, setComparePopupInfo] = useState<any>(null);

  const [activeFilters, setActiveFilters] = useState([
    { id: 'phase', value: 'All Phases' },
    { id: 'hotspot', value: 'All Hotspots' },
    { id: 'respondent', value: 'All Groups' },
    { id: 'timeline', value: '3 months' },
  ]);

  const removeFilter = (filterId: string) => {
    setActiveFilters(activeFilters.filter(filter => filter.id !== filterId));
  };

  const prepareChartData = () => {
    const filteredGroups = respondentData.filter(group => 
      selectedRespondentGroups.includes(group.name)
    );
    
    return filteredGroups.map(group => {
      const data: any = { name: group.name };
      
      if (selectedPhases.includes('1')) {
        data['Phase 1 (T1)'] = group.phase1;
      }
      
      if (selectedPhases.includes('2')) {
        data['Phase 2 (T2)'] = group.phase2;
      }
      
      if (selectedPhases.includes('3')) {
        data['Phase 3 (T3)'] = group.phase3;
      }
      
      return data;
    });
  };

  const prepareHotspotData = () => {
    const filteredHotspots = hotspotData.filter(hs => 
      selectedHotspots.includes(hs.hotspot)
    );
    
    return filteredHotspots.map(hs => {
      const data: any = { name: hs.hotspot };
      
      if (selectedPhases.includes('1')) {
        data['Phase 1 (T1)'] = hs.phase1;
      }
      
      if (selectedPhases.includes('2')) {
        data['Phase 2 (T2)'] = hs.phase2;
      }
      
      if (selectedPhases.includes('3')) {
        data['Phase 3 (T3)'] = hs.phase3;
      }
      
      return data;
    });
  };

  const prepareCombinedData = () => {
    return combinedData.filter(item => 
      selectedHotspots.includes(item.hotspot)
    );
  };

  const generateKeyObservations = () => {
    if (respondentData.length === 0) return [];
    
    const allScores = respondentData.flatMap(group => [
      group.phase1,
      group.phase2,
      group.phase3
    ]);
    
    const overallAverage = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    const stdDev = calculateStandardDeviation(allScores);
    
    const observations = respondentData.flatMap(group => {
      return generateRiskObservations(
        group.phase3,
        group.phase2,
        overallAverage,
        stdDev
      ).map(obs => ({
        ...obs,
        text: `${group.name}: ${obs.text}`
      }));
    });
    
    return observations
      .filter(obs => obs.importance === "high" || obs.importance === "medium")
      .slice(0, 4)
      .map(obs => obs.text);
  };

  const keyObservations = generateKeyObservations();

  const handleDataPointClick = (data: any, dataKey: string) => {
    const value = data[dataKey];
    const phaseMatch = dataKey.match(/Phase (\d+)/);
    const phase = phaseMatch ? phaseMatch[1] : '';
    
    setPopupInfo({
      group: data.name,
      phase: phase,
      value: value,
      interpretation: interpretRPScore(value)
    });
  };

  const handleComparePoint = (data: any, dataKey: string) => {
    const value = data[dataKey];
    const phaseMatch = dataKey.match(/Phase (\d+)/);
    const phase = phaseMatch ? phaseMatch[1] : '';
    
    setComparePopupInfo({
      group: data.name,
      phase: phase,
      value: value,
      interpretation: interpretRPScore(value)
    });
  };

  const handleChartClick = (e: any) => {
    if (e && e.isTooltipActive === false) {
      setPopupInfo(null);
      setComparePopupInfo(null);
    }
  };

  const prepareTableData = () => {
    const filteredHotspots = hotspotDetails.filter(hs => 
      selectedHotspots.includes(hs.name)
    );
    
    return filteredHotspots.map(hs => {
      let change = 0;
      
      if (selectedPhases.includes('1') && selectedPhases.includes('3')) {
        change = hs.phase1 - hs.phase3;
      } else if (selectedPhases.includes('1') && selectedPhases.includes('2')) {
        change = hs.phase1 - hs.phase2;
      } else if (selectedPhases.includes('2') && selectedPhases.includes('3')) {
        change = hs.phase2 - hs.phase3;
      }
      
      return {
        ...hs,
        change: change.toFixed(1)
      };
    });
  };

  const renderRespondentChart = () => {
    const chartData = prepareChartData();
    
    return (
      <div className="h-[450px] relative" id="chart-container">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No respondent data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                label={{ value: 'Respondent Groups', position: 'insideBottom', offset: -15 }}
              />
              <YAxis 
                domain={[0, 9]}
                label={{ value: 'Mean RP scores', angle: -90, position: 'insideLeft' }}
                ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
              />
              <Tooltip 
                formatter={(value: any) => [`${value}`, 'RP Score']}
                labelFormatter={(label) => `${label}`}
              />
              <Legend />
              
              {showThresholdLine && (
                <ReferenceLine 
                  y={thresholdValue} 
                  stroke="#f59e0b" 
                  strokeDasharray="3 3" 
                  strokeWidth={2}
                  label={{ 
                    value: `Threshold (${thresholdValue})`, 
                    position: 'right',
                    fill: '#f59e0b',
                    fontSize: 12
                  }} 
                />
              )}
              
              {selectedPhases.includes('1') && (
                <Line
                  type="monotone"
                  dataKey="Phase 1 (T1)"
                  name="Phase 1 (T1)"
                  stroke="#3b82f6"
                  activeDot={{ r: 6, onClick: (e: any) => handleDataPointClick(e.payload, "Phase 1 (T1)") }}
                  strokeWidth={2}
                />
              )}
              
              {selectedPhases.includes('2') && (
                <Line
                  type="monotone"
                  dataKey="Phase 2 (T2)"
                  name="Phase 2 (T2)"
                  stroke="#ef4444"
                  activeDot={{ r: 6, onClick: (e: any) => handleDataPointClick(e.payload, "Phase 2 (T2)") }}
                  strokeWidth={2}
                />
              )}
              
              {selectedPhases.includes('3') && (
                <Line
                  type="monotone"
                  dataKey="Phase 3 (T3)"
                  name="Phase 3 (T3)"
                  stroke="#22c55e"
                  activeDot={{ r: 6, onClick: (e: any) => handleDataPointClick(e.payload, "Phase 3 (T3)") }}
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}

        {popupInfo && (
          <div className="absolute left-1/4 top-1/3 bg-pink-500 text-white p-3 rounded-md shadow-lg max-w-xs z-10">
            <p className="font-bold">{popupInfo.group} - Phase {popupInfo.phase}</p>
            <p>RP Score: {popupInfo.value.toFixed(1)}</p>
            <p>{popupInfo.interpretation}</p>
            <button 
              onClick={() => setPopupInfo(null)} 
              className="absolute top-1 right-1 text-white hover:text-gray-200"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {comparePopupInfo && (
          <div className="absolute right-1/4 bottom-1/3 bg-blue-500 text-white p-3 rounded-md shadow-lg max-w-xs z-10">
            <p className="font-bold">{comparePopupInfo.group} - Phase {comparePopupInfo.phase}</p>
            <p>RP Score: {comparePopupInfo.value.toFixed(1)}</p>
            <p>{comparePopupInfo.interpretation}</p>
            <button 
              onClick={() => setComparePopupInfo(null)} 
              className="absolute top-1 right-1 text-white hover:text-gray-200"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };
    
  const renderHotspotChart = () => {
    const chartData = prepareHotspotData();
    
    return (
      <div className="h-[450px] relative">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No hotspot data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                label={{ value: 'Hotspots', position: 'insideBottom', offset: -15 }}
              />
              <YAxis 
                domain={[0, 9]}
                label={{ value: 'Mean RP scores', angle: -90, position: 'insideLeft' }}
                ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
              />
              <Tooltip 
                formatter={(value: any) => [`${value}`, 'RP Score']}
                labelFormatter={(label) => `${label}`}
              />
              <Legend />
              
              {showThresholdLine && (
                <ReferenceLine 
                  y={thresholdValue} 
                  stroke="#f59e0b" 
                  strokeDasharray="3 3" 
                  strokeWidth={2}
                  label={{ 
                    value: `Threshold (${thresholdValue})`, 
                    position: 'right',
                    fill: '#f59e0b',
                    fontSize: 12
                  }} 
                />
              )}
              
              {selectedPhases.includes('1') && (
                <Line
                  type="monotone"
                  dataKey="Phase 1 (T1)"
                  name="Phase 1 (T1)"
                  stroke="#3b82f6"
                  activeDot={{ r: 6, onClick: (e: any) => handleDataPointClick(e.payload, "Phase 1 (T1)") }}
                  strokeWidth={2}
                />
              )}
              
              {selectedPhases.includes('2') && (
                <Line
                  type="monotone"
                  dataKey="Phase 2 (T2)"
                  name="Phase 2 (T2)"
                  stroke="#ef4444"
                  activeDot={{ r: 6, onClick: (e: any) => handleDataPointClick(e.payload, "Phase 2 (T2)") }}
                  strokeWidth={2}
                />
              )}
              
              {selectedPhases.includes('3') && (
                <Line
                  type="monotone"
                  dataKey="Phase 3 (T3)"
                  name="Phase 3 (T3)"
                  stroke="#22c55e"
                  activeDot={{ r: 6, onClick: (e: any) => handleDataPointClick(e.payload, "Phase 3 (T3)") }}
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
        
        {popupInfo && (
          <div className="absolute left-1/4 top-1/3 bg-pink-500 text-white p-3 rounded-md shadow-lg max-w-xs z-10">
            <p className="font-bold">{popupInfo.group} - Phase {popupInfo.phase}</p>
            <p>RP Score: {popupInfo.value.toFixed(1)}</p>
            <button 
              onClick={() => setPopupInfo(null)} 
              className="absolute top-1 right-1 text-white hover:text-gray-200"
            >
              <X size={14} />
            </button>
          </div>
        )}
        
        {comparePopupInfo && (
          <div className="absolute right-1/4 bottom-1/3 bg-blue-500 text-white p-3 rounded-md shadow-lg max-w-xs z-10">
            <p className="font-bold">{comparePopupInfo.group} - Phase {comparePopupInfo.phase}</p>
            <p>RP Score: {comparePopupInfo.value.toFixed(1)}</p>
            <button 
              onClick={() => setComparePopupInfo(null)} 
              className="absolute top-1 right-1 text-white hover:text-gray-200"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };
    
  const renderDisruptionChart = () => {
    const chartData = prepareCombinedData();
    
    return (
      <div className="h-[450px] relative">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No combined data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hotspot"
                label={{ value: 'Hotspots', position: 'insideBottom', offset: -15 }}
              />
              <YAxis 
                yAxisId="left"
                label={{ value: 'RP Score', angle: -90, position: 'insideLeft' }}
                domain={[0, 9]}
                ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                label={{ value: 'Disruption %', angle: 90, position: 'insideRight' }}
                domain={[0, 100]}
              />
              <Tooltip />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="rpScore" 
                name="RP Score" 
                fill="#8884d8"
                onClick={(data) => handleDataPointClick(data, "rpScore")}
              />
              <Bar 
                yAxisId="right" 
                dataKey="disruption" 
                name="Disruption %" 
                fill="#82ca9d" 
                onClick={(data) => handleComparePoint(data, "disruption")}
              />
              
              {showThresholdLine && (
                <ReferenceLine 
                  y={thresholdValue} 
                  yAxisId="left"
                  stroke="#f59e0b" 
                  strokeDasharray="3 3" 
                  strokeWidth={2}
                  label={{ 
                    value: `Threshold (${thresholdValue})`, 
                    position: 'right',
                    fill: '#f59e0b',
                    fontSize: 12
                  }} 
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
        
        {popupInfo && (
          <div className="absolute left-1/4 top-1/3 bg-pink-500 text-white p-3 rounded-md shadow-lg max-w-xs z-10">
            <p className="font-bold">{popupInfo.group}</p>
            <p>RP Score: {popupInfo.value.toFixed(1)}</p>
            <button 
              onClick={() => setPopupInfo(null)} 
              className="absolute top-1 right-1 text-white hover:text-gray-200"
            >
              <X size={14} />
            </button>
          </div>
        )}
        
        {comparePopupInfo && (
          <div className="absolute right-1/4 bottom-1/3 bg-blue-500 text-white p-3 rounded-md shadow-lg max-w-xs z-10">
            <p className="font-bold">{comparePopupInfo.group}</p>
            <p>Disruption: {comparePopupInfo.value}%</p>
            <button 
              onClick={() => setComparePopupInfo(null)} 
              className="absolute top-1 right-1 text-white hover:text-gray-200"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderChart = () => {
    switch (activeTab) {
      case 'rp-respondent':
        return renderRespondentChart();
      case 'rp-hotspot':
        return renderHotspotChart();
      case 'rp-disruption':
        return renderDisruptionChart();
      case 'rp-heatmap':
        // Transform hotspotDetails to match the HeatmapRow structure
        const heatmapData = hotspotDetails.map(detail => ({
          hotspot: detail.name,
          cells: {
            'Phase 1': detail.phase1,
            'Phase 2': detail.phase2,
            'Phase 3': detail.phase3
          }
        }));
        // REMOVE: return <RiskHeatmapTable data={heatmapData} />;
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center gap-3">
          <Link to="/" aria-label="Back" className="text-primary hover:text-primary/80">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl md:text-4xl font-bold text-primary">Risk Perception Analysis</h1>
        </header>

        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="w-full md:w-48">
            <select
              className="w-full p-2 border rounded-md"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <div className="bg-yellow-300 py-3 px-6 text-center rounded-md">
              <h2 className="text-xl font-bold text-black">AO Level (Till present)</h2>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Select Graph Type</p>
                <div className="flex border rounded-md overflow-hidden">
                  <button 
                    className={`flex-1 py-2 px-4 text-sm ${activeTab === 'rp-respondent' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    onClick={() => setActiveTab('rp-respondent')}
                  >
                    RP by Respondent
                  </button>
                  <button 
                    className={`flex-1 py-2 px-4 text-sm ${activeTab === 'rp-hotspot' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    onClick={() => setActiveTab('rp-hotspot')}
                  >
                    RP by Hotspot
                  </button>
                  <button 
                    className={`flex-1 py-2 px-4 text-sm ${activeTab === 'rp-disruption' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    onClick={() => setActiveTab('rp-disruption')}
                  >
                    RP vs Disruption
                  </button>
                  <button 
                    className={`flex-1 py-2 px-4 text-sm ${activeTab === 'rp-heatmap' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    onClick={() => setActiveTab('rp-heatmap')}
                  >
                    RP Heatmap
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 flex items-center justify-end">
                <p className="text-sm text-gray-500 mr-4">
                  X-Axis: {activeTab === 'rp-respondent' ? 'Respondent Groups' : 
                            activeTab === 'rp-hotspot' ? 'Hotspots' : 'Hotspots'}
                </p>
                <p className="text-sm text-gray-500">
                  Y-Axis: {activeTab === 'rp-disruption' ? 'RP Score / Disruption %' : 'Mean RP Scores (1-9)'}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between mt-4 gap-4">
              <div className="md:w-1/2">
                <p className="text-sm font-medium mb-2">Filter Data</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-between w-full px-3 py-2 text-sm font-medium border rounded-md bg-white">
                      <span>
                        {selectedPhases.length === 0
                          ? "Select Phase"
                          : selectedPhases.length === phases.length
                          ? "All Phases"
                          : `${selectedPhases.length} Phases`}
                      </span>
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>Phases</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {phases.map((phase) => (
                        <DropdownMenuCheckboxItem
                          key={phase}
                          checked={selectedPhases.includes(phase)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPhases((prev) => [...prev, phase]);
                            } else {
                              setSelectedPhases((prev) => prev.filter((p) => p !== phase));
                            }
                          }}
                        >
                          Phase {phase}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-between w-full px-3 py-2 text-sm font-medium border rounded-md bg-white">
                      <span>
                        {selectedHotspots.length === 0
                          ? "Select Hotspot"
                          : selectedHotspots.length === hotspots.length
                          ? "All Hotspots"
                          : `${selectedHotspots.length} Hotspots`}
                      </span>
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>Hotspots</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {hotspots.map((hotspot) => (
                        <DropdownMenuCheckboxItem
                          key={hotspot}
                          checked={selectedHotspots.includes(hotspot)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedHotspots((prev) => [...prev, hotspot]);
                            } else {
                              setSelectedHotspots((prev) => prev.filter((h) => h !== hotspot));
                            }
                          }}
                        >
                          {hotspot}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-between w-full px-3 py-2 text-sm font-medium border rounded-md bg-white">
                      <span>
                        {selectedRespondentGroups.length === 0
                          ? "Select Groups"
                          : selectedRespondentGroups.length === respondentGroups.length
                          ? "All Groups"
                          : `${selectedRespondentGroups.length} Groups`}
                      </span>
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>Respondent Groups</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {respondentGroups.map((group) => (
                        <DropdownMenuCheckboxItem
                          key={group}
                          checked={selectedRespondentGroups.includes(group)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRespondentGroups((prev) => [...prev, group]);
                            } else {
                              setSelectedRespondentGroups((prev) => prev.filter((g) => g !== group));
                            }
                          }}
                        >
                          {group}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="md:w-1/3">
                <p className="text-sm font-medium mb-2">Options</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="threshold-line" 
                      checked={showThresholdLine} 
                      onCheckedChange={(checked) => setShowThresholdLine(checked === true)} 
                    />
                    <label htmlFor="threshold-line" className="text-sm">Show threshold line</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="data-table" 
                      checked={showDataTable} 
                      onCheckedChange={(checked) => setShowDataTable(checked === true)} 
                    />
                    <label htmlFor="data-table" className="text-sm">Show data table</label>
                  </div>
                </div>
              </div>

              <div className="md:w-1/6 flex items-end">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Apply</Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <div 
                  key={filter.id} 
                  className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm"
                >
                  <span>{filter.value}</span>
                  <button 
                    onClick={() => removeFilter(filter.id)} 
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8">
              {renderChart()}
            </div>

            {showDataTable && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Data Table</h3>
                <DataTable 
                  data={prepareTableData()} 
                  loading={false}
                />
              </div>
            )}

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">Key Observations</h3>
              {keyObservations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {keyObservations.map((observation, index) => (
                    <div 
                      key={index}
                      className="bg-white border rounded-md p-3 flex items-start gap-3"
                    >
                      <div className="bg-purple-100 h-6 w-6 rounded-full flex items-center justify-center shrink-0">
                        <Brain className="h-4 w-4 text-purple-600" />
                      </div>
                      <p className="text-sm">{observation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No observations available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AOOverview;