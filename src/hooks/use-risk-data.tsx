import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { riskScoresByPhase, combinedRiskDisruption } from "@/data/risk/riskData";

export type FilterOptions = {
  ao?: string[];
  hotspots?: string[];
  phases?: number[];
  metrics?: string[];
  respondentGroups?: string[];
  timeline?: string;
};

export type DetailedMetric = {
  id: string;
  risk_score_id: string;
  metric_name: string;
  score: number;
  likelihood: number;
  severity: number;
  created_at: string;
  respondent_type?: string;
  phase?: number;
  hotspot_name?: string;
  ao_name?: string;
};

export type RiskScore = {
  id: string;
  respondent_type: string;
  score: number;
  phase: number;
  hotspot_id: string;
  data_completeness: number;
  created_at: string;
  hotspot_name?: string;
  ao_name?: string;
};

export type LocationData = {
  id: string;
  name: string;
  created_at: string;
};

export type HotspotData = {
  id: string;
  name: string;
  ao_location_id: string;
  created_at: string;
  ao_name?: string;
};

// Generate fallback data based on mock data
const generateFallbackDetailedMetrics = (): DetailedMetric[] => {
  const metrics: DetailedMetric[] = [];
  
  const phases = [1, 2, 3];
  const respondentTypes = [
    "Criminal Networks/Traffickers",
    "Demand Center Operators",
    "Community/Vulnerable Community",
    "Law Enforcement Officers",
    "Government",
    "NGO",
    "Business",
    "Security"
  ];
  
  const metricNames = [
    "Supply Chain Risk",
    "Detection Risk",
    "Market Access Risk",
    "Legal Risk",
    "Financial Risk",
    "Regulatory Impact",
    "Employee Safety",
    "Resource Allocation"
  ];
  
  let idCounter = 1;
  
  respondentTypes.forEach((respondentType, rIndex) => {
    phases.forEach(phase => {
      metricNames.forEach((metricName, mIndex) => {
        // Use different scores based on phase and type
        const riskScore = riskScoresByPhase.find(r => 
          r.name === respondentType ||
          (respondentType.includes(r.name) || r.name.includes(respondentType))
        );
        
        const baseScore = riskScore ? 
          (phase === 1 ? riskScore.phase1 : phase === 2 ? riskScore.phase2 : riskScore.phase3) : 
          3 + (phase * 0.8);
          
        // Add some randomness for metrics
        const metricVariation = ((mIndex % 5) - 2) * 0.5;
        const score = Math.min(9, Math.max(1, baseScore + metricVariation));
        
        // Calculate likelihood and severity
        const likelihood = Math.min(3, Math.max(1, Math.round(Math.sqrt(score))));
        const severity = Math.min(3, Math.max(1, Math.round(score / likelihood)));
        
        metrics.push({
          id: `fallback-${idCounter++}`,
          risk_score_id: `rs-${rIndex}-${phase}`,
          metric_name: metricName,
          score: score,
          likelihood: likelihood,
          severity: severity,
          created_at: new Date().toISOString(),
          respondent_type: respondentType,
          phase: phase,
          hotspot_name: `HS${phase}`,
          ao_name: `AO${Math.floor(rIndex / 3) + 1}`
        });
      });
    });
  });
  
  return metrics;
};

// Generate fallback risk scores
const generateFallbackRiskScores = (): RiskScore[] => {
  const riskScores: RiskScore[] = [];
  
  const phases = [1, 2, 3];
  const respondentTypes = [
    "Criminal Networks/Traffickers",
    "Demand Center Operators",
    "Community/Vulnerable Community",
    "Law Enforcement Officers",
    "Government",
    "NGO",
    "Business",
    "Security"
  ];
  
  let idCounter = 1;
  
  respondentTypes.forEach((respondentType, rIndex) => {
    phases.forEach(phase => {
      const riskScore = riskScoresByPhase.find(r => 
        r.name === respondentType ||
        (respondentType.includes(r.name) || r.name.includes(respondentType))
      );
      
      const score = riskScore ? 
        (phase === 1 ? riskScore.phase1 : phase === 2 ? riskScore.phase2 : riskScore.phase3) : 
        3 + (phase * 0.8);
      
      riskScores.push({
        id: `rs-${rIndex}-${phase}`,
        respondent_type: respondentType,
        score: score,
        phase: phase,
        hotspot_id: `hs-${phase}`,
        data_completeness: 85 + (phase * 5),
        created_at: new Date().toISOString(),
        hotspot_name: `HS${phase}`,
        ao_name: `AO${Math.floor(rIndex / 3) + 1}`
      });
    });
  });
  
  return riskScores;
};

export function useRiskData(filters: FilterOptions = {}) {
  const [detailedMetrics, setDetailedMetrics] = useState<DetailedMetric[]>([]);
  const [riskScores, setRiskScores] = useState<RiskScore[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [hotspots, setHotspots] = useState<HotspotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  // Filter options
  const [availableAOs, setAvailableAOs] = useState<string[]>([]);
  const [availableHotspots, setAvailableHotspots] = useState<string[]>([]);
  const [availablePhases, setAvailablePhases] = useState<number[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [availableRespondentGroups, setAvailableRespondentGroups] = useState<string[]>([]);
  
  // Fallback data for offline use or when Supabase fails
  const loadFallbackData = () => {
    setUsingFallbackData(true);
    console.log("Loading fallback data");
    
    const fallbackLocations: LocationData[] = [
      { id: "loc1", name: "Mumbai", created_at: new Date().toISOString() },
      { id: "loc2", name: "Delhi", created_at: new Date().toISOString() },
      { id: "loc3", name: "Chennai", created_at: new Date().toISOString() },
      { id: "loc4", name: "Kolkata", created_at: new Date().toISOString() }
    ];
    
    const fallbackHotspots: HotspotData[] = [
      { id: "hs-1", name: "HS1", ao_location_id: "loc1", created_at: new Date().toISOString(), ao_name: "Mumbai" },
      { id: "hs-2", name: "HS2", ao_location_id: "loc2", created_at: new Date().toISOString(), ao_name: "Delhi" },
      { id: "hs-3", name: "HS3", ao_location_id: "loc3", created_at: new Date().toISOString(), ao_name: "Chennai" }
    ];
    
    const fallbackRiskScores = generateFallbackRiskScores();
    const fallbackDetailedMetrics = generateFallbackDetailedMetrics();
    
    setLocations(fallbackLocations);
    setHotspots(fallbackHotspots);
    setRiskScores(fallbackRiskScores);
    setDetailedMetrics(fallbackDetailedMetrics);
    
    setAvailableAOs([...new Set(fallbackLocations.map(loc => loc.name))]);
    setAvailableHotspots([...new Set(fallbackHotspots.map(h => h.name))]);
    setAvailablePhases([...new Set(fallbackRiskScores.map(rs => rs.phase))]);
    setAvailableRespondentGroups([...new Set(fallbackRiskScores.map(rs => rs.respondent_type))]);
    // Filter out "Outreach Programs" from available metrics
    setAvailableMetrics([...new Set(fallbackDetailedMetrics.map(m => m.metric_name))].filter(metric => metric !== "Outreach Programs"));
    
    setLoading(false);
    toast.info("Using offline data. Some features may be limited.");
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch locations
      const { data: aoData, error: aoError } = await supabase
        .from('ao_locations')
        .select('*');

      if (aoError) throw aoError;
      
      setLocations(aoData || []);
      setAvailableAOs((aoData || []).map(ao => ao.name));

      // Fetch hotspots with location join
      const { data: hotspotData, error: hotspotError } = await supabase
        .from('hotspots')
        .select(`
          *,
          ao_locations:ao_location_id (name)
        `);

      if (hotspotError) throw hotspotError;
      
      const processedHotspots = (hotspotData || []).map(h => ({
        ...h,
        ao_name: h.ao_locations?.name
      }));
      
      setHotspots(processedHotspots);
      setAvailableHotspots(processedHotspots.map(h => h.name));

      // Fetch risk scores with hotspot join
      let riskScoreQuery = supabase
        .from('risk_scores')
        .select(`
          *,
          hotspots:hotspot_id (
            name,
            ao_locations:ao_location_id (name)
          )
        `);

      // Apply filters
      if (filters.ao && filters.ao.length > 0) {
        const hotspotIds = processedHotspots
          .filter(h => filters.ao?.includes(h.ao_name || ''))
          .map(h => h.id);
        
        riskScoreQuery = riskScoreQuery.in('hotspot_id', hotspotIds);
      }

      if (filters.hotspots && filters.hotspots.length > 0) {
        const hotspotIds = processedHotspots
          .filter(h => filters.hotspots?.includes(h.name))
          .map(h => h.id);
        
        riskScoreQuery = riskScoreQuery.in('hotspot_id', hotspotIds);
      }

      if (filters.phases && filters.phases.length > 0) {
        riskScoreQuery = riskScoreQuery.in('phase', filters.phases);
      }

      if (filters.respondentGroups && filters.respondentGroups.length > 0) {
        riskScoreQuery = riskScoreQuery.in('respondent_type', filters.respondentGroups);
      }
      
      const { data: riskScoreData, error: riskScoreError } = await riskScoreQuery;

      if (riskScoreError) throw riskScoreError;
      
      const processedRiskScores = (riskScoreData || []).map(rs => ({
        ...rs,
        hotspot_name: rs.hotspots?.name,
        ao_name: rs.hotspots?.ao_locations?.name
      }));
      
      setRiskScores(processedRiskScores);
      setAvailablePhases([...new Set(processedRiskScores.map(rs => rs.phase))]);
      setAvailableRespondentGroups([...new Set(processedRiskScores.map(rs => rs.respondent_type))]);

      // Get risk score IDs for filtering metrics
      const riskScoreIds = processedRiskScores.map(rs => rs.id);
      
      // Initialize array to hold all metrics data
      let allMetricsData: any[] = [];
      
      // Batch size to avoid URL length limitations
      const BATCH_SIZE = 50;
      
      // Split risk score IDs into batches
      if (riskScoreIds.length > 0) {
        // Process in batches to avoid URL length issues
        for (let i = 0; i < riskScoreIds.length; i += BATCH_SIZE) {
          const batchIds = riskScoreIds.slice(i, i + BATCH_SIZE);
          console.log(`Fetching metrics batch ${i/BATCH_SIZE + 1} of ${Math.ceil(riskScoreIds.length/BATCH_SIZE)}`);
          
          let metricsQuery = supabase
            .from('detailed_metrics')
            .select('*')
            .in('risk_score_id', batchIds);
          
          if (filters.metrics && filters.metrics.length > 0) {
            metricsQuery = metricsQuery.in('metric_name', filters.metrics);
          }
          
          const { data: batchData, error: batchError } = await metricsQuery;
          
          if (batchError) {
            console.error(`Error fetching metrics batch ${i/BATCH_SIZE + 1}:`, batchError);
            throw batchError;
          }
          
          if (batchData && batchData.length > 0) {
            allMetricsData = [...allMetricsData, ...batchData];
          }
        }
      } else {
        // If no risk score IDs, just fetch based on other filters
        let metricsQuery = supabase
          .from('detailed_metrics')
          .select('*');
        
        if (filters.metrics && filters.metrics.length > 0) {
          metricsQuery = metricsQuery.in('metric_name', filters.metrics);
        }
        
        const { data: metricsData, error: metricsError } = await metricsQuery;
        
        if (metricsError) throw metricsError;
        
        if (metricsData) {
          allMetricsData = metricsData;
        }
      }
      
      // Process all metrics data from all batches
      
      // Join with risk scores to get phase, respondent type, etc.
      const processedMetrics = allMetricsData.map(metric => {
        const relatedRiskScore = processedRiskScores.find(rs => rs.id === metric.risk_score_id);
        return {
          ...metric,
          respondent_type: relatedRiskScore?.respondent_type,
          phase: relatedRiskScore?.phase,
          hotspot_name: relatedRiskScore?.hotspot_name,
          ao_name: relatedRiskScore?.ao_name
        };
      });
      
      setDetailedMetrics(processedMetrics);
      // Filter out "Outreach Programs" from available metrics
      setAvailableMetrics([...new Set(processedMetrics.map(m => m.metric_name))].filter(metric => metric !== "Outreach Programs"));
      
      // Reset the fallback data flag
      setUsingFallbackData(false);
      
    } catch (err) {
      console.error("Error fetching risk data:", err);
      setError(err as Error);
      
      // If fetch fails, use fallback data
      loadFallbackData();
      
      // Don't show error toast if we're using fallback data
      // toast.error("Failed to load risk data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [JSON.stringify(filters)]);

  // Add method to update data after CSV upload
  const updateWithUploadedData = (uploadedData: any[]) => {
    if (!uploadedData.length) return;

    try {
      // Extract distinct values for filters
      const newAOs = [...new Set(uploadedData.map(row => row['AO Location'] || ''))].filter(Boolean);
      const newHotspots = [...new Set(uploadedData.map(row => row['Hotspot'] || ''))].filter(Boolean);
      const newPhases = [...new Set(uploadedData.map(row => Number(row['Phase']) || 0))].filter(Boolean);
      const newMetrics = [...new Set(uploadedData.map(row => row['Metric Name'] || ''))].filter(Boolean);
      const newRespondentGroups = [...new Set(uploadedData.map(row => row['Respondent Type'] || ''))].filter(Boolean);
      
      // Group data by respondent type + phase + hotspot (risk score level)
      const riskScoreGroups = new Map();
      
      uploadedData.forEach(row => {
        const key = `${row['Respondent Type']}-${row['Phase']}-${row['Hotspot']}`;
        if (!riskScoreGroups.has(key)) {
          riskScoreGroups.set(key, {
            id: `uploaded-rs-${key}`,
            respondent_type: row['Respondent Type'],
            phase: Number(row['Phase']),
            hotspot_name: row['Hotspot'],
            ao_name: row['AO Location'],
            score: Number(row['Risk Score']) || 0,
            data_completeness: 100, // Assuming complete for uploaded data
            created_at: new Date().toISOString(),
            hotspot_id: `uploaded-hotspot-${row['Hotspot']}`,
            // Don't include metrics here since it doesn't exist on RiskScore type
          });
        }
      });
      
      // Process metrics separately
      const detailedMetricsMap = new Map();
      
      uploadedData.forEach(row => {
        const riskScoreKey = `${row['Respondent Type']}-${row['Phase']}-${row['Hotspot']}`;
        const metricKey = `${riskScoreKey}-${row['Metric Name']}`;
        
        if (!detailedMetricsMap.has(metricKey)) {
          detailedMetricsMap.set(metricKey, {
            id: `uploaded-metric-${metricKey}`,
            risk_score_id: `uploaded-rs-${riskScoreKey}`,
            metric_name: row['Metric Name'],
            score: Number(row['Risk Score']) || 0,
            likelihood: Number(row['Likelihood']) || 1,
            severity: Number(row['Severity']) || 1,
            created_at: new Date().toISOString(),
            respondent_type: row['Respondent Type'],
            phase: Number(row['Phase']),
            hotspot_name: row['Hotspot'],
            ao_name: row['AO Location']
          });
        }
      });
      
      // Convert to arrays
      const newRiskScores: RiskScore[] = Array.from(riskScoreGroups.values());
      const newDetailedMetrics: DetailedMetric[] = Array.from(detailedMetricsMap.values());
      
      // Create hotspots and locations based on uploaded data
      const newHotspotObjects: HotspotData[] = newHotspots.map(hotspot => ({
        id: `uploaded-hotspot-${hotspot}`,
        name: hotspot,
        ao_location_id: `uploaded-location-${uploadedData.find(row => row['Hotspot'] === hotspot)?.['AO Location'] || 'unknown'}`,
        created_at: new Date().toISOString(),
        ao_name: uploadedData.find(row => row['Hotspot'] === hotspot)?.['AO Location'] || 'unknown'
      }));
      
      const newLocationObjects: LocationData[] = newAOs.map(ao => ({
        id: `uploaded-location-${ao}`,
        name: ao,
        created_at: new Date().toISOString()
      }));
      
      // Update state
      setDetailedMetrics(newDetailedMetrics);
      setRiskScores(newRiskScores);
      setHotspots(newHotspotObjects);
      setLocations(newLocationObjects);
      
      // Update available filters
      setAvailableAOs(newAOs);
      setAvailableHotspots(newHotspots);
      setAvailablePhases(newPhases);
      // Filter out "Outreach Programs" from available metrics
      setAvailableMetrics(newMetrics.filter(metric => metric !== "Outreach Programs"));
      setAvailableRespondentGroups(newRespondentGroups);
      
      // Set using uploaded data flag
      setUsingFallbackData(true);
      toast.success(`Visualizations updated with ${uploadedData.length} data points`);
    } catch (err) {
      console.error("Error processing uploaded data:", err);
      toast.error("Failed to process uploaded data");
    }
  };

  return {
    detailedMetrics,
    riskScores,
    locations,
    hotspots,
    loading,
    error,
    availableAOs,
    availableHotspots,
    availablePhases,
    availableMetrics,
    availableRespondentGroups,
    refreshData: fetchData,
    updateWithUploadedData,
    usingFallbackData
  };
}
