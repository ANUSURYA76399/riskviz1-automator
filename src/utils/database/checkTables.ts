
import { supabase } from "@/integrations/supabase/client";

export const checkTablesExist = async (): Promise<boolean> => {
  try {
    console.log("Checking if database tables exist...");
    
    // Array to store status of each table
    const tableStatus: Record<string, boolean> = {
      ao_locations: false,
      hotspots: false,
      risk_scores: false,
      detailed_metrics: false
    };
    
    // Check if ao_locations table exists
    try {
      const { data: locationsData, error: locationsError } = await supabase
        .from('ao_locations')
        .select('id')
        .limit(1);
        
      if (locationsError) {
        console.error("ao_locations table error:", locationsError.message);
      } else {
        tableStatus.ao_locations = true;
        console.log("ao_locations table exists");
      }
    } catch (error) {
      console.error("Error checking ao_locations:", error);
    }
    
    // Check if hotspots table exists
    try {
      const { data: hotspotsData, error: hotspotsError } = await supabase
        .from('hotspots')
        .select('id')
        .limit(1);
        
      if (hotspotsError) {
        console.error("hotspots table error:", hotspotsError.message);
      } else {
        tableStatus.hotspots = true;
        console.log("hotspots table exists");
      }
    } catch (error) {
      console.error("Error checking hotspots:", error);
    }
    
    // Check if risk_scores table exists
    try {
      const { data: riskScoresData, error: riskScoresError } = await supabase
        .from('risk_scores')
        .select('id')
        .limit(1);
        
      if (riskScoresError) {
        console.error("risk_scores table error:", riskScoresError.message);
      } else {
        tableStatus.risk_scores = true;
        console.log("risk_scores table exists");
      }
    } catch (error) {
      console.error("Error checking risk_scores:", error);
    }
    
    // Check if detailed_metrics table exists
    try {
      const { data: metricsData, error: metricsError } = await supabase
        .from('detailed_metrics')
        .select('id')
        .limit(1);
        
      if (metricsError) {
        console.error("detailed_metrics table error:", metricsError.message);
      } else {
        tableStatus.detailed_metrics = true;
        console.log("detailed_metrics table exists");
      }
    } catch (error) {
      console.error("Error checking detailed_metrics:", error);
    }
    
    // Check all tables exist
    const allTablesExist = Object.values(tableStatus).every(status => status);
    
    if (allTablesExist) {
      console.log("All required database tables exist");
      return true;
    } else {
      const missingTables = Object.entries(tableStatus)
        .filter(([_, exists]) => !exists)
        .map(([tableName]) => tableName);
      
      console.error(`Missing required tables: ${missingTables.join(', ')}`);
      return false;
    }
  } catch (error) {
    console.error("Error checking if tables exist:", error);
    return false;
  }
};
