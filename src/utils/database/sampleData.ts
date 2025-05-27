
import { SampleData } from "./types";

// Define arrays with proper values as requested by user
const respondentTypes = [
  "Criminal Networks/Traffickers", 
  "Law Enforcement Officers", 
  "Community/Vulnerable community", 
  "Government", 
  "NGO",
  "Business", 
  "Security", 
  "Demand Center Operators",
  "Transporters", 
  "Customers",
  "Financial Networks", 
  "Survivors/Families of Survivors", 
  "Lawyers"
];

const locations = [
  "Mumbai", "Bangalore", "Delhi", "Chennai", "Kolkata", "Hyderabad",
  "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Patna", "Nagpur",
  "Indore", "Bhopal", "Surat", "Kanpur"
];

const hotspots = [
  "Hotspot 1", "Hotspot 2", "Hotspot 3", "Hotspot 4", "Hotspot 5",
  "Hotspot 6", "Hotspot 7", "Hotspot 8", "Hotspot 9", "Hotspot 10"
];

const metricTemplates = [
  { name: "Financial Transactions" },
  { name: "Network Size" },
  { name: "Response Time" },
  { name: "Resource Allocation" },
  { name: "Community Engagement" },
  { name: "Awareness Level" },
  { name: "Policy Efficiency" },
  { name: "Regulatory Impact" },
  { name: "Outreach Programs" },
  { name: "Volunteer Participation" },
  { name: "Supply Chain Risk" },
  { name: "Market Exposure" },
  { name: "Incident Reports" },
  { name: "Response Readiness" },
  { name: "Demand Fluctuations" },
  { name: "Operator Availability" },
  { name: "Tech Adoption" },
  { name: "Employee Safety" },
  { name: "Policy Updates" },
  { name: "Quality Assurance" }
];

// Timeline values as requested
const timelineValues = ["3 months", "6 months", "9 months", "12 months", "15 months", "18 months"];

const phases = [1, 2, 3, 4];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to avoid repeated unique combinations.
const usedCombinations = new Set();

function getUniqueCombination() {
  let candidate, i = 0;
  do {
    const respondent_type = respondentTypes[getRandomInt(0, respondentTypes.length - 1)];
    const hotspot = hotspots[getRandomInt(0, hotspots.length - 1)];
    const ao_location = locations[getRandomInt(0, locations.length - 1)];
    const phase = phases[getRandomInt(0, phases.length - 1)];
    const timeline = timelineValues[getRandomInt(0, timelineValues.length - 1)];
    candidate = `${respondent_type}|${hotspot}|${ao_location}|${phase}|${timeline}`;
    i++;
    // To break any unlikely infinite loops if all combos exhausted
    if (i > 1000) throw new Error("Ran out of unique combinations.");
  } while (usedCombinations.has(candidate));
  usedCombinations.add(candidate);

  const [respondent_type, hotspot, ao_location, phase, timeline] = candidate.split('|');
  return {
    respondent_type,
    hotspot,
    ao_location,
    phase: Number(phase),
    timeline
  };
}

export const generateSampleData = (): SampleData[] => {
  const sampleData: SampleData[] = [];
  usedCombinations.clear();

  for (let i = 0; i < 100; i++) {
    const { respondent_type, hotspot, ao_location, phase, timeline } = getUniqueCombination();

    // Only select a single metric for each data point to avoid duplication in CSV
    const metricIndex = getRandomInt(0, metricTemplates.length - 1);
    const metric = metricTemplates[metricIndex];
    
    // Generate a single metric for each row (now without value)
    const metrics = [{
      name: metric.name,
      value: 0 // This will be removed from the CSV
    }];

    // Generate likelihood and severity (both on 1-3 scale)
    const likelihood = getRandomInt(1, 3);
    const severity = getRandomInt(1, 3);
    
    // Risk score will be calculated during CSV export
    const risk_score = 0; // Placeholder, will be calculated dynamically

    sampleData.push({
      respondent_type,
      hotspot,
      ao_location,
      phase,
      risk_score,
      likelihood,
      severity,
      metrics,
      timeline
    });
  }
  return sampleData;
};
