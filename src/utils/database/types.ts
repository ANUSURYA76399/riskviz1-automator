
export interface SampleData {
  respondent_type: string;
  hotspot: string;
  ao_location: string;
  phase: number;
  risk_score: number;
  likelihood: number;
  severity: number;
  metrics: {
    name: string;
    value: number;
  }[];
  timeline?: string; // Added timeline field
}
