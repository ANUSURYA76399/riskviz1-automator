import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronDown, Filter, FilterX, FileText, Info, Sparkles, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScatterPlot } from "@/components/charts/ScatterPlot";
import { GroupBarChart } from "@/components/charts/GroupBarChart";
import { RiskHeatmap } from "@/components/charts/RiskHeatmap";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { RiskDistribution } from "@/components/charts/RiskDistribution";
import { CombinedChart } from "@/components/charts/CombinedChart";
import { MetricScoreChart } from "@/components/charts/MetricScoreChart";
import { MetricScoreSection } from "@/components/visualizations/MetricScoreSection";
import { MetricWiseScoreChart } from "@/components/charts/MetricWiseScoreChart";
import { RespondentGroupBarChart } from "@/components/charts/RespondentGroupBarChart";
import { PhaseComparisonLineChart } from "@/components/charts/PhaseComparisonLineChart";
import { LocationPhaseComparisonChart } from "@/components/charts/LocationPhaseComparisonChart";
import { RiskMatrix } from "@/components/charts/RiskMatrix";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { chartTypes } from "@/data/risk/chartTypes";
import { getDataSummary, generateVisualizationInsights, getVisualizationRecommendations, getComparisonInsights, getKeyMetrics } from "@/data/risk";
import { useRiskData, FilterOptions } from "@/hooks/use-risk-data";
import { DataTable } from "@/components/visualize/DataTable";
import { generateInsightsFromData } from "@/utils/insightGenerator";
import { toast } from "sonner";
import { parseUploadedCSV, connectParsedDataToVisualizations } from "@/utils/database/csvExport";
import { countRiskLevels } from "@/utils/riskCalculations";
import { mapRespondentTypeToEnum } from "@/utils/database/respondentTypes";
import { useDataContext } from "@/contexts/DataContext";
import { uploadFile, getRiskData, RiskDataPoint, checkBackendHealth } from "@/services/api";

const Visualize = () => {
  // Use our data context
  const { csvData = [], setCsvData, chartData, setChartData, refreshCharts, uploadId, forceRefreshData } = useDataContext();

  const [selectedChartType, setSelectedChartType] = useState("scatter");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [selectedAOs, setSelectedAOs] = useState<string[]>([]);
  const [selectedHotspots, setSelectedHotspots] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>(""); // Changed to single string for single select
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedPhases, setSelectedPhases] = useState<number[]>([]);
  const [selectedTimelines, setSelectedTimelines] = useState<string[]>([]); // Changed to array for multi-select
  const [showDataTable, setShowDataTable] = useState(false);
  const [separateGraphs, setSeparateGraphs] = useState(true);
  const [isMetricView, setIsMetricView] = useState(false);
  const [isPhaseView, setIsPhaseView] = useState(false);
  const [isHeatmapView, setIsHeatmapView] = useState(false);
  const [isPhaseComparisonView, setIsPhaseComparisonView] = useState(false);
  const [isAOHeatmapView, setIsAOHeatmapView] = useState(false);
  const [isDisruptionView, setIsDisruptionView] = useState(false);
  const [riskDistributionData, setRiskDistributionData] = useState({ low: 0, moderate: 0, high: 0 });
  const [dynamicInsights, setDynamicInsights] = useState<any[]>([]);
  const [dynamicSummary, setDynamicSummary] = useState<any>({});
  const [dataComparisonInsights, setDataComparisonInsights] = useState<any>({});
  const [keyMetrics, setKeyMetrics] = useState<any>({});
  const [isLoadingBackendData, setIsLoadingBackendData] = useState(false);
  const [backendDataFetched, setBackendDataFetched] = useState(false);

  const { 
    detailedMetrics, 
    riskScores, 
    loading, 
    availableAOs,
    availableHotspots,
    availablePhases,
    availableMetrics,
    availableRespondentGroups,
    updateWithUploadedData
  } = useRiskData(filters);
  
  // Get selected location for insights generation without default value
  const selectedAO = selectedAOs.length > 0 ? selectedAOs[0] : '';
  
  // Fetch data from backend
  const fetchBackendData = useCallback(async () => {
    try {
      setIsLoadingBackendData(true);
      console.log('Attempting to fetch data from backend...');
      
      // First check if backend is available
      const isBackendAvailable = await checkBackendHealth();
      if (!isBackendAvailable) {
        console.warn('Backend is not available, cannot fetch risk data');
        toast.error('Backend server is not available. Using local data only.');
        setIsLoadingBackendData(false);
        return;
      }
      
      const riskData = await getRiskData();
      
      if (riskData && riskData.length > 0) {
        console.log("Fetched risk data from backend:", riskData.length, "records");
        
        // Convert backend data format to frontend format
        const convertedData = riskData.map(item => ({
          'Respondent Type': item.respondent_type,
          'Hotspot': item.hotspot,
          'AO Location': item.ao_location,
          'Phase': item.phase,
          'Risk Score': item.risk_score,
          'Likelihood': item.likelihood,
          'Severity': item.severity,
          'Risk Level': item.risk_level,
          'Metric Name': item.metric_name,
          'Timeline': item.timeline,
          'id': `backend-${item.id}`
        }));
        
        // Process the data for visualization
        setCsvData(convertedData);
        const formattedChartData = connectParsedDataToVisualizations(convertedData);
        if (formattedChartData) {
          setChartData(formattedChartData);
          
          // Update risk distribution
          if (formattedChartData.summaryStats?.riskLevels) {
            setRiskDistributionData(formattedChartData.summaryStats.riskLevels);
          }
        }
        
        // Update risk data hook with new data
        updateWithUploadedData(convertedData);
        setBackendDataFetched(true);
        toast.success(`Loaded ${convertedData.length} records from database`);
      } else {
        console.log("No risk data found in backend");
        toast.info("No data found in the database. Please upload a file.");
      }
    } catch (error) {
      console.error("Error fetching risk data:", error);
      toast.error("Failed to fetch data from server. Using local data only.");
    } finally {
      setIsLoadingBackendData(false);
    }
  }, [setCsvData, setChartData, updateWithUploadedData]);
  
  // Fetch backend data on initial load
  useEffect(() => {
    if (!backendDataFetched) {
      fetchBackendData();
    }
  }, [fetchBackendData, backendDataFetched]);
  
  // Update dynamic insights and summaries whenever data changes
  useEffect(() => {
    if (csvData && csvData.length > 0 && selectedAO) {
      // Generate dynamic insights based on the uploaded data
      const newInsights = generateVisualizationInsights(csvData, selectedAO);
      setDynamicInsights(newInsights);
      
      // Generate data summary
      const summary = getDataSummary(selectedAO);
      setDynamicSummary(summary);
      
      // Generate comparison insights
      const comparisonData = getComparisonInsights(csvData, selectedAO, 'phase');
      setDataComparisonInsights(comparisonData);
      
      // Generate key metrics
      const metrics = getKeyMetrics(csvData, selectedAO);
      setKeyMetrics(metrics);
    } else if (detailedMetrics.length > 0) {
      // Use the detailedMetrics and riskScores as fallback if no CSV data
      const staticInsights = generateInsightsFromData(detailedMetrics, riskScores);
      setDynamicInsights(staticInsights.map(insight => ({
        title: "Risk Insight",
        description: insight.text,
        severity: insight.importance
      })));
    }
  }, [csvData, selectedAO, detailedMetrics, riskScores]);
  
  useEffect(() => {
    if (detailedMetrics.length > 0) {
      const counts = countRiskLevels(detailedMetrics);
      setRiskDistributionData(counts);
    }
  }, [detailedMetrics]);

  // Removed the auto-selection of AOs and Phases from this useEffect
  // Now filters will remain unselected until user explicitly chooses them

  useEffect(() => {
    const newFilters: FilterOptions = {};
    
    if (selectedAOs.length > 0) {
      newFilters.ao = selectedAOs;
    }
    
    if (selectedHotspots.length > 0) {
      newFilters.hotspots = selectedHotspots;
    }
    
    if (selectedGroup) { // Changed to handle single string
      newFilters.respondentGroups = [mapRespondentTypeToEnum(selectedGroup)];
    }
    
    if (selectedMetrics.length > 0) {
      newFilters.metrics = selectedMetrics;
    }
    
    if (selectedPhases.length > 0) {
      newFilters.phases = selectedPhases;
    }
    
    setFilters(newFilters);
  }, [selectedAOs, selectedHotspots, selectedGroup, selectedMetrics, selectedPhases]);

  useEffect(() => {
    setIsMetricView(false);
    setIsPhaseView(false);
    setIsHeatmapView(false);
    setIsPhaseComparisonView(false);
    setIsAOHeatmapView(false);
    setIsDisruptionView(false);
    
    switch (selectedChartType) {
      case 'metric-view':
        setIsMetricView(true);
        break;
      case 'phase-view':
        setIsPhaseView(true);
        break;
      case 'heatmap-view':
        setIsHeatmapView(true);
        break;
      case 'phase-comparison':
        setIsPhaseComparisonView(true);
        break;
      case 'ao-heatmap':
        setIsAOHeatmapView(true);
        break;
      case 'disruption-view':
        setIsDisruptionView(true);
        break;
      default:
        break;
    }
  }, [selectedChartType]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      toast.info(`Processing ${file.name}...`);
      
      // Reset all selections before loading new data
      setSelectedAOs([]);
      setSelectedHotspots([]);
      setSelectedGroup("");
      setSelectedMetrics([]);
      setSelectedPhases([]);
      setSelectedTimelines([]);
      setFilters({});
      
      // First parse the data locally for immediate visualization
      const parsedData = await parseUploadedCSV(file);
      console.log("Parsed data length:", parsedData.length);
      
      // Log the first few rows to help with debugging
      if (parsedData.length > 0) {
        console.log("Sample data rows:", parsedData.slice(0, 3));
      }
      
      // Store parsed data in context
      setCsvData(parsedData);
      
      // Format data for different chart types
      const formattedChartData = connectParsedDataToVisualizations(parsedData);
      if (formattedChartData) {
        console.log("Setting formatted chart data:", formattedChartData);
        
        // Store chart data in context
        setChartData(formattedChartData);
        
        // Update risk distribution
        if (formattedChartData.summaryStats?.riskLevels) {
          setRiskDistributionData(formattedChartData.summaryStats.riskLevels);
        }
        
        // Generate new insights based on the uploaded data if we have a selected AO
        if (selectedAO) {
          const newInsights = generateVisualizationInsights(parsedData, selectedAO);
          setDynamicInsights(newInsights);
          
          // Generate data summary
          const summary = getDataSummary(selectedAO);
          setDynamicSummary(summary);
          
          // Generate comparison insights
          const comparisonData = getComparisonInsights(parsedData, selectedAO, 'phase');
          setDataComparisonInsights(comparisonData);
          
          // Generate key metrics
          const metrics = getKeyMetrics(parsedData, selectedAO);
          setKeyMetrics(metrics);
        }
        
        // Force a complete data refresh to ensure charts are updated
        forceRefreshData();
        
        // Log the chart data to help with debugging
        console.log("Scatter plot data:", formattedChartData.scatterPlotData);
        console.log("Group bar chart data:", formattedChartData.groupBarChartData);
        console.log("Combined chart data:", formattedChartData.combinedChartData);
        
        // Ensure the chart type is set to something that will show data
        if (!selectedChartType || selectedChartType === 'none') {
          if (formattedChartData.scatterPlotData?.length > 0) {
            setSelectedChartType('scatter');
          } else if (formattedChartData.groupBarChartData?.length > 0) {
            setSelectedChartType('bar');
          }
        }
      }
      
      // Update risk data hook with new data for any components that use it
      updateWithUploadedData(parsedData);
      
      // Also upload the file to the backend server
      try {
        // First check if backend is available
        const isBackendAvailable = await checkBackendHealth();
        if (!isBackendAvailable) {
          console.warn('Backend is not available, cannot upload file');
          toast.warning('Backend server is not available. Data is only loaded locally.');
          return;
        }
        
        toast.info('Uploading data to server...');
        const uploadResponse = await uploadFile(file);
        console.log("Backend upload response:", uploadResponse);
        toast.success(`Data uploaded to server: ${uploadResponse}`);
        
        // Refresh data from backend after upload
        setTimeout(() => {
          fetchBackendData();
        }, 1000); // Give the server a moment to process the data
      } catch (uploadError) {
        console.error("Error uploading to backend:", uploadError);
        toast.error("Warning: Data loaded locally but failed to upload to server");
      }
      
      toast.success(`Successfully loaded ${parsedData.length} rows from ${file.name}`);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast.error("Error parsing CSV file");
    }
    
    e.target.value = ''; // Clear the input for future uploads
  };

  const applyFilters = () => {
    // Generate insights based on the selected location
    if (csvData && csvData.length > 0 && selectedAO) {
      const newInsights = generateVisualizationInsights(csvData, selectedAO);
      setDynamicInsights(newInsights);
      
      // Generate data summary
      const summary = getDataSummary(selectedAO);
      setDynamicSummary(summary);
      
      // Generate comparison insights
      const comparisonData = getComparisonInsights(csvData, selectedAO, 'phase');
      setDataComparisonInsights(comparisonData);
      
      // Generate key metrics
      const metrics = getKeyMetrics(csvData, selectedAO);
      setKeyMetrics(metrics);
    }
  
    forceRefreshData(); // Force a complete re-render of the charts with new filters
    toast.success("Filters applied successfully");
  };

  const clearFilters = () => {
    setSelectedAOs([]);
    setSelectedHotspots([]);
    setSelectedGroup(""); // Clear single select
    setSelectedMetrics([]);
    setSelectedPhases([]);
    setSelectedTimelines([]); // Clear multi-select
    setFilters({});
    toast.info("Filters cleared");
  };

  const renderChart = () => {
    console.log("Rendering chart with type:", selectedChartType);
    if (!chartData) {
      console.log("No chart data available");
      return (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 mb-2">No data available. Please upload a CSV file first.</p>
          </div>
        </div>
      );
    }

    // The currently selected hotspot, defaulting to HS1 if none selected
    const selectedHotspot = selectedHotspots.length > 0 ? selectedHotspots[0] : 'HS1';

    switch (selectedChartType) {
      case 'scatter':
        console.log("Rendering ScatterPlot with data:", chartData?.scatterPlotData);
        return <ScatterPlot 
                 key={`scatter-${uploadId}`} 
                 customData={chartData?.scatterPlotData} 
               />;
      case 'bar':
        console.log("Rendering GroupBarChart with data:", chartData?.groupBarChartData);
        return <GroupBarChart 
                 key={`bar-${uploadId}`} 
                 customData={chartData?.groupBarChartData} 
               />;
      case 'heatmap':
      case 'heatmap-ao':
        // Create default data if not available from context
        const heatmapData = chartData?.rawData || [];
        const columnLabels = ['HS1', 'HS2', 'HS3', 'HS4', 'HS5'].filter(hs => 
          selectedHotspots.length === 0 || selectedHotspots.includes(hs)
        );
        
        return <RiskHeatmap 
          key={`heatmap-${uploadId}`}
          data={heatmapData} 
          columnLabels={columnLabels} 
        />;
      case 'combined':
        console.log("Rendering CombinedChart with data:", chartData?.combinedChartData);
        // Pass props that match the component's requirements
        return <CombinedChart 
                 key={`combined-${uploadId}`} 
               />;
      case 'metric-score':
        console.log("Rendering Metric-wise RP scores across hotspots");
        return <MetricWiseScoreChart 
                 key={`metric-score-${uploadId}`} 
                 selectedHotspot={selectedHotspot}
                 title="CRIMINAL NETWORKS"
                 height={450}
               />;
      case 'metric-wise-score':
        console.log("Rendering Metric Wise Score Chart for", selectedHotspot);
        return <MetricWiseScoreChart 
                 key={`metric-wise-score-${uploadId}`} 
                 selectedHotspot={selectedHotspot}
               />;
      case 'respondent-group':
        console.log("Rendering Respondent Group Bar Chart for", selectedHotspot);
        return <RespondentGroupBarChart 
                 key={`respondent-group-${uploadId}`} 
                 selectedHotspot={selectedHotspot}
                 selectedPhase={1} // Default to Phase 1
               />;
      case 'phase-comparison':
        console.log("Rendering Phase Comparison Line Chart for", selectedHotspot);
        return <PhaseComparisonLineChart 
                 key={`phase-comparison-${uploadId}`} 
                 selectedHotspot={selectedHotspot}
               />;
      case 'location-comparison':
        console.log("Rendering Location Phase Comparison Chart");
        return <LocationPhaseComparisonChart 
                 key={`location-comparison-${uploadId}`} 
                 selectedLocation="Mumbai" // Default to Mumbai
               />;
      case 'risk-matrix':
        console.log("Rendering Risk Matrix Chart");
        // Provide default empty data to satisfy TypeScript
        return <RiskMatrix 
          key={`risk-matrix-${uploadId}`} 
          data={chartData?.rawData || []} 
        />;
      default:
        console.log("Rendering default ScatterPlot");
        return <ScatterPlot 
                 key={`scatter-default-${uploadId}`} 
                 customData={chartData?.scatterPlotData} 
               />;
    }
  };

  const getChartTitle = () => {
    if (isMetricView) {
      return "Metric-wise RP scores in respondent groups across hotspots";
    }
    if (isPhaseView) {
      return "RP scores across Hotspots in Phases";
    }
    if (isHeatmapView) {
      return "Heat maps comparing the RP scores across Hotspots";
    }
    if (isPhaseComparisonView) {
      return "RP scores of Hotspots at different phases";
    }
    if (isAOHeatmapView) {
      return "Heat maps comparing the RP scores of the AOs across 3 phases";
    }
    if (isDisruptionView) {
      return "Comparison between RP scores and Disruption in each Phase";
    }
    
    return chartTypes.find(c => c.id === selectedChartType)?.title || "Risk Perception Analysis";
  };

  const availableRespondentGroupsOptions = availableRespondentGroups.length > 0 
    ? availableRespondentGroups 
    : [
        "Criminal Networks/Traffickers",
        "Demand Center Operators",
        "Transporters",
        "Customers",
        "Financial Networks",
        "Law Enforcement Officers",
        "Community/Vulnerable Community",
        "Digital/Virtual Community",
        "Survivors/Families of Survivors",
        "Lawyers"
      ];

  const timelineOptions = chartData?.uniqueValues?.Timeline?.length && chartData.uniqueValues.Timeline.length > 0
    ? chartData.uniqueValues.Timeline
    : [
        "3 months", 
        "6 months", 
        "9 months", 
        "12 months",
        "15 months", 
        "18 months", 
        "120 months (3 month gap)"
      ];

  const extendedChartTypes = [
    {
      id: "metric-view",
      title: "Metric-wise RP scores across hotspots",
      description: "Line chart showing metric-wise risk perception scores in respondent groups"
    },
    {
      id: "phase-view",
      title: "RP scores across Hotspots in Phases",
      description: "Bar chart showing risk perception scores across hotspots in phases"
    },
    {
      id: "heatmap-view",
      title: "Heat maps for RP scores across Hotspots",
      description: "Heat map comparison of risk perception scores across different hotspots"
    },
    {
      id: "phase-comparison",
      title: "RP scores comparison across phases",
      description: "Line graphs showing risk perception scores across different phases for multiple hotspots"
    },
    {
      id: "ao-heatmap",
      title: "Heat maps for RP scores across AOs",
      description: "Heat map comparison of risk perception scores of the AOs across 3 phases"
    },
    {
      id: "disruption-view",
      title: "RP scores vs Disruption",
      description: "Comparison between risk perception scores and disruption in each phase"
    }
  ];

  return (
    <div className="min-h-screen bg-blue-900">
      <div className="p-6 flex items-center space-x-3">
        <Link to="/" className="text-white hover:text-gray-300 flex items-center gap-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Risk Perception Analysis</h1>
      </div>
      
      <div className="bg-white min-h-screen p-4">
        <div className="max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="p-5 lg:col-span-1">
            <h2 className="text-xl font-bold mb-4">Filters</h2>
            
            <div className="mb-5 p-4 border rounded-md bg-gray-50">
              <h3 className="text-md font-medium mb-3">Upload Data</h3>
              <p className="text-sm text-gray-500 mb-3">
                Upload a new CSV file to update all visualizations
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between">
                  <label className="font-medium text-sm">Select AO</label>
                  <span className="text-xs text-gray-500">multiple</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full border rounded-md p-2 flex justify-between items-center text-left" asChild>
                    <Button variant="outline">
                      {selectedAOs.length === 0 
                        ? 'Select AO' 
                        : selectedAOs.length === 1 
                          ? selectedAOs[0] 
                          : `${selectedAOs.length} selected`}
                      <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Areas of Operation</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(availableAOs || []).map((ao) => (
                      <DropdownMenuCheckboxItem
                        key={ao}
                        checked={selectedAOs.includes(ao)}
                        onCheckedChange={(checked) => {
                          setSelectedAOs(prev =>
                            checked
                              ? [...prev, ao]
                              : prev.filter(a => a !== ao)
                          );
                        }}
                      >
                        {ao}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <label className="font-medium text-sm">Select Hotspot</label>
                  <span className="text-xs text-gray-500">multiple</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full border rounded-md p-2 flex justify-between items-center text-left" asChild>
                    <Button variant="outline">
                      {selectedHotspots.length === 0 
                        ? 'Select Hotspots' 
                        : selectedHotspots.length === 1 
                          ? selectedHotspots[0] 
                          : `${selectedHotspots.length} selected`}
                      <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Hotspots</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableHotspots.map((hotspot) => (
                      <DropdownMenuCheckboxItem
                        key={hotspot}
                        checked={selectedHotspots.includes(hotspot)}
                        onCheckedChange={(checked) => {
                          setSelectedHotspots(prev =>
                            checked
                              ? [...prev, hotspot]
                              : prev.filter(h => h !== hotspot)
                          );
                        }}
                      >
                        {hotspot}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <label className="font-medium text-sm">Select Respondent Group</label>
                  <span className="text-xs text-gray-500">single select</span>
                </div>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRespondentGroupsOptions.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <label className="font-medium text-sm">Select Metric</label>
                  <span className="text-xs text-gray-500">multiple</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full border rounded-md p-2 flex justify-between items-center text-left" asChild>
                    <Button variant="outline">
                      {selectedMetrics.length === 0 
                        ? 'Select Metrics' 
                        : selectedMetrics.length === 1 
                          ? selectedMetrics[0] 
                          : `${selectedMetrics.length} selected`}
                      <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Metrics</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Ensure metrics 1-4 are always available, but exclude specific metrics */}
                    {['Metric 1', 'Metric 2', 'Metric 3', 'Metric 4', ...availableMetrics.filter(m => 
                      !['Metric 1', 'Metric 2', 'Metric 3', 'Metric 4', 
                        'Supply Chain Risk', 'Detection Risk', 'Market Access Risk', 'Legal Risk', 
                        'Financial Risk', 'Regulatory Impact', 'Employee Safety', 'Resource Allocation',
                        'Outreach Programs'
                      ].includes(m))].map((metric) => (
                      <DropdownMenuCheckboxItem
                        key={metric}
                        checked={selectedMetrics.includes(metric)}
                        onCheckedChange={(checked) => {
                          setSelectedMetrics(prev => 
                            checked 
                              ? [...prev, metric] 
                              : prev.filter(m => m !== metric)
                          );
                        }}
                      >
                        {metric}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <label className="font-medium text-sm">Select Phase</label>
                  <span className="text-xs text-gray-500">multiple</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full border rounded-md p-2 flex justify-between items-center text-left" asChild>
                    <Button variant="outline">
                      {selectedPhases.length === 0 
                        ? 'Select Phases' 
                        : selectedPhases.length === 1 
                          ? `Phase ${selectedPhases[0]}` 
                          : `${selectedPhases.length} phases selected`}
                      <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Phases</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Always show phases 1-4, regardless of what's in the data */}
                    {[1, 2, 3, 4].map((phase) => (
                      <DropdownMenuCheckboxItem
                        key={phase}
                        checked={selectedPhases.includes(phase)}
                        onCheckedChange={(checked) => {
                          setSelectedPhases(prev => 
                            checked 
                              ? [...prev, phase] 
                              : prev.filter(p => p !== phase)
                          );
                        }}
                      >
                        Phase {phase}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <label className="font-medium text-sm">Select Timeline</label>
                  <span className="text-xs text-gray-500">multiple</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full border rounded-md p-2 flex justify-between items-center text-left" asChild>
                    <Button variant="outline">
                      {selectedTimelines.length === 0 
                        ? 'Select Timeline' 
                        : selectedTimelines.length === 1 
                          ? selectedTimelines[0]
                          : `${selectedTimelines.length} selected`}
                      <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Timeline Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(timelineOptions ?? []).map((timeline) => (
                      <DropdownMenuCheckboxItem
                        key={timeline}
                        checked={selectedTimelines.includes(timeline)}
                        onCheckedChange={(checked) => {
                          setSelectedTimelines(prev => 
                            checked
                              ? [...prev, timeline]
                              : prev.filter(t => t !== timeline)
                          );
                        }}
                      >
                        {timeline}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div>
                <h3 className="font-medium text-sm mb-2">Display Options</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id="separateGraphs" 
                    checked={separateGraphs} 
                    onCheckedChange={(checked) => setSeparateGraphs(!!checked)} 
                  />
                  <label htmlFor="separateGraphs">Separate Graphs</label>
                </div>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowDataTable(!showDataTable)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {showDataTable ? 'Hide data table' : 'Show data table'}
                </Button>
              </div>
              
              <div className="pt-2 space-y-2">
                <Button 
                  className="w-full bg-blue-800 hover:bg-blue-900 flex items-center" 
                  onClick={applyFilters}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center" 
                  onClick={clearFilters}
                >
                  <FilterX className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </Card>
          
          <div className="lg:col-span-3 space-y-6">
            <div className="flex justify-between items-center">
              <Select 
                value={selectedChartType} 
                onValueChange={setSelectedChartType}
              >
                <SelectTrigger className="w-[400px]">
                  <SelectValue placeholder="Select visualization type" />
                </SelectTrigger>
                <SelectContent>
                  {extendedChartTypes.map((chart) => (
                    <SelectItem key={chart.id} value={chart.id}>
                      <div data-description={chart.description}>
                        {chart.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" className="bg-purple-500 text-white hover:bg-purple-600 rounded-full">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Insight
              </Button>
            </div>
            
            <div>
              <div className="bg-yellow-300 p-3 rounded-t-md">
                <h2 className="font-bold text-lg">
                  {chartTypes.find(c => c.id === selectedChartType)?.title || "Risk Perception Analysis"}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border rounded-b-md p-4">
                  {loading ? (
                    <div className="flex justify-center items-center h-[300px]">
                      <p className="text-gray-500">Loading chart data...</p>
                    </div>
                  ) : (
                    <>
                      {/* Debug info to verify data is being passed */}
                      <div className="text-xs text-gray-400 mb-2">
                        Chart ID: {uploadId} | Data available: {chartData ? 'Yes' : 'No'} | CSV data: {csvData.length} rows
                      </div>
                      {renderChart()}
                    </>
                  )}
                </div>
                
                <div className="bg-white border p-4 rounded-md">
                  <h3 className="font-bold text-lg mb-4">Data summary</h3>
                  
                  <div className="space-y-3">
                    {loading ? (
                      <p className="text-center text-gray-500">Loading summary...</p>
                    ) : chartData?.summaryStats || detailedMetrics.length > 0 ? (
                      <>
                        <div className="flex justify-between">
                          <span>Min Score</span>
                          <span className="font-bold">
                            {chartData?.summaryStats?.minScore?.toFixed(1) || 
                             dynamicSummary?.minRPScore?.toFixed(1) ||
                             Math.min(...detailedMetrics.map(m => m.score)).toFixed(1)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Max Score</span>
                          <span className="font-bold">
                            {chartData?.summaryStats?.maxScore?.toFixed(1) || 
                             dynamicSummary?.maxRPScore?.toFixed(1) ||
                             Math.max(...detailedMetrics.map(m => m.score)).toFixed(1)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Average Score</span>
                          <span className="font-bold">
                            {chartData?.summaryStats?.avgScore?.toFixed(1) || 
                             dynamicSummary?.avgRPScore?.toFixed(1) ||
                             (detailedMetrics.reduce((sum, m) => sum + m.score, 0) / Math.max(1, detailedMetrics.length)).toFixed(1)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>Data Range</span>
                          <span className="font-bold">
                            {dynamicSummary?.dataRange || keyMetrics?.dataRange || 'March 2025-May 2025'}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>Total Risk Items</span>
                          <span className="font-bold">{csvData.length || detailedMetrics.length}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Low Risk</span>
                          <span className="font-bold text-green-500">{riskDistributionData.low}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Moderate Risk</span>
                          <span className="font-bold text-yellow-500">{riskDistributionData.moderate}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>High Risk</span>
                          <span className="font-bold text-red-500">{riskDistributionData.high}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-center text-gray-500">No data available</p>
                    )}
                  </div>
                  
                  <h3 className="font-bold mt-6 mb-3">Key Observations:</h3>
                  <div className="space-y-2">
                    {loading ? (
                      <p className="text-center text-gray-500">Generating insights...</p>
                    ) : dynamicInsights && dynamicInsights.length > 0 ? (
                      dynamicInsights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className={`h-2 w-2 rounded-full mt-2 ${
                            insight.severity === 'high' 
                              ? 'bg-red-500' 
                              : insight.severity === 'medium' 
                                ? 'bg-yellow-500' 
                                : 'bg-blue-500'
                          }`}></div>
                          <p className="text-sm">{insight.description}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500">No insights available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {showDataTable && (
              <Card className="p-4 mt-6">
                <h3 className="text-lg font-bold mb-4">Data Table</h3>
                <DataTable 
                  data={csvData.length > 0 ? csvData : detailedMetrics} 
                  loading={loading} 
                />
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visualize;
