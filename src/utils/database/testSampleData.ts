
import { supabase } from "@/integrations/supabase/client";
import { generateSampleData } from "./sampleData";
import { checkTablesExist } from "./checkTables";
import { mapRespondentTypeToEnum } from "./respondentTypes";

export const testSampleData = async () => {
  try {
    console.log("Starting sample data test...");
    
    // Check authentication
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!sessionData.session) {
      throw new Error("You must be logged in to test sample data");
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .maybeSingle();
    
    if (profileError) {
      console.error("Profile fetch error:", profileError);
      if (profileError.message.includes("relation") && profileError.message.includes("does not exist")) {
        throw new Error("The profiles table does not exist. Please contact your administrator to run the database setup script.");
      }
      throw new Error(`Profile fetch error: ${profileError.message}`);
    }
    
    // Check if tables exist
    const tablesExist = await checkTablesExist();
    
    if (!tablesExist) {
      throw new Error("Database tables not set up. Please contact your administrator to run the database setup script.");
    }
    
    console.log("Generating sample data...");
    const sampleData = generateSampleData();
    
    // Process each sample data item
    for (const data of sampleData) {
      console.log(`Inserting data for ${data.respondent_type}`);
      
      const mappedRespondentType = mapRespondentTypeToEnum(data.respondent_type);
      
      // Let's verify AO location first
      console.log("Looking for AO location:", data.ao_location);
      const { data: locationData, error: locationFetchError } = await supabase
        .from('ao_locations')
        .select('id')
        .eq('name', data.ao_location)
        .maybeSingle();
      
      if (locationFetchError) {
        console.error("Error finding location:", locationFetchError);
        throw new Error(`Error finding location: ${locationFetchError.message}`);
      }
      
      let locationId = locationData?.id;
      
      // If no location found, create one
      if (!locationId) {
        console.log("Creating new location:", data.ao_location);
        const { data: newLocationData, error: locationError } = await supabase
          .from('ao_locations')
          .insert({ name: data.ao_location })
          .select('id')
          .single();
          
        if (locationError) {
          console.error("Error creating location:", locationError);
          throw new Error(`Failed to create location: ${locationError.message}`);
        }
        
        if (!newLocationData) {
          throw new Error("No location data returned after insert");
        }
        
        locationId = newLocationData.id;
        console.log("New location created with ID:", locationId);
      } else {
        console.log("Found existing location with ID:", locationId);
      }
      
      // Now look for the hotspot or create it
      console.log("Looking for hotspot:", data.hotspot);
      const { data: hotspotData, error: hotspotError } = await supabase
        .from('hotspots')
        .select('id')
        .eq('name', data.hotspot)
        .maybeSingle();
      
      if (hotspotError) {
        console.error("Error finding hotspot:", hotspotError);
        throw new Error(`Error finding hotspot: ${hotspotError.message}`);
      }
      
      let hotspotId = hotspotData?.id;
      
      // If no hotspot found, create one
      if (!hotspotId) {
        console.log("Creating new hotspot:", data.hotspot, "for location ID:", locationId);
        const { data: newHotspotData, error: newHotspotError } = await supabase
          .from('hotspots')
          .insert({
            name: data.hotspot,
            ao_location_id: locationId
          })
          .select('id')
          .single();
          
        if (newHotspotError) {
          console.error("Error creating hotspot:", newHotspotError);
          throw new Error(`Failed to create hotspot: ${newHotspotError.message}`);
        }
        
        if (!newHotspotData) {
          throw new Error("No hotspot data returned after insert");
        }
        
        hotspotId = newHotspotData.id;
        console.log("New hotspot created with ID:", hotspotId);
      } else {
        console.log("Found existing hotspot with ID:", hotspotId);
      }
      
      // Insert risk score
      console.log("Inserting risk score for hotspot ID:", hotspotId);
      const { data: riskScoreData, error: riskError } = await supabase
        .from('risk_scores')
        .insert({
          respondent_type: mappedRespondentType,
          score: data.risk_score,
          phase: data.phase,
          hotspot_id: hotspotId,
          data_completeness: 100
        })
        .select('id')
        .single();

      if (riskError) {
        console.error("Error inserting risk score:", riskError);
        throw new Error(`Failed to insert risk score: ${riskError.message}`);
      }

      if (!riskScoreData) {
        throw new Error("No risk score data returned after insert");
      }

      console.log("Inserted risk score:", riskScoreData);
      
      // Insert detailed metrics
      for (const metric of data.metrics) {
        console.log(`Inserting metric: ${metric.name}`);
        
        const { error: metricError } = await supabase
          .from('detailed_metrics')
          .insert({
            risk_score_id: riskScoreData.id,
            metric_name: metric.name,
            score: metric.value,
            likelihood: data.likelihood,
            severity: data.severity,
          });

        if (metricError) {
          console.error("Error inserting metric:", metricError);
          throw new Error(`Failed to insert metric: ${metricError.message}`);
        }
      }
    }
    
    console.log("Sample data test completed successfully");
    return true;
  } catch (error) {
    console.error("Error in testSampleData:", error);
    throw error;
  }
};
