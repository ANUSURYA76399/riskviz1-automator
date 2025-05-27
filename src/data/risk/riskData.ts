// Risk perception data by group and phase
export const riskScoresByPhase = [
  {
    name: 'Criminal Networks',
    phase1: 2.3,
    phase2: 4.7,
    phase3: 7.1,
    trendChange: 2.4,
    dataCompleteness: 100,
    previousCompleteness: 95,
  },
  {
    name: 'Demand Center',
    phase1: 3.1,
    phase2: 5.2,
    phase3: 6.4,
    trendChange: 1.2,
    dataCompleteness: 95,
    previousCompleteness: 92,
  },
  {
    name: 'Community',
    phase1: 2.8,
    phase2: 3.9,
    phase3: 5.1,
    trendChange: 1.2,
    dataCompleteness: 78,
    previousCompleteness: 85,
  },
  {
    name: 'Law Enforcement',
    phase1: 4.2,
    phase2: 5.8,
    phase3: 6.7,
    trendChange: 0.9,
    dataCompleteness: 92,
    previousCompleteness: 88,
  },
  {
    name: 'Government',
    phase1: 2.2,
    phase2: 2.9,
    phase3: 3.5,
    trendChange: 0.6,
    dataCompleteness: 65,
    previousCompleteness: 70,
  },
  {
    name: 'NGO',
    phase1: 2.5,
    phase2: 4.1,
    phase3: 4.8,
    trendChange: 0.7,
    dataCompleteness: 88,
    previousCompleteness: 81,
  },
  {
    name: 'Business',
    phase1: 2.9,
    phase2: 4.3,
    phase3: 5.3,
    trendChange: 1.0,
    dataCompleteness: 83,
    previousCompleteness: 79,
  },
  {
    name: 'Security',
    phase1: 3.8,
    phase2: 5.6,
    phase3: 6.9,
    trendChange: 1.3,
    dataCompleteness: 91,
    previousCompleteness: 90,
  },
];

// Risk perception scores by location
export const riskScoresByLocation = [
  {
    location: 'Mumbai',
    criminalNetworks: 7.1,
    demandCenter: 6.4,
    community: 5.1,
    lawEnforcement: 6.7,
    government: 3.5,
    overallScore: 5.8,
  },
  {
    location: 'Delhi',
    criminalNetworks: 6.8,
    demandCenter: 5.9,
    community: 4.7,
    lawEnforcement: 6.1,
    government: 2.9,
    overallScore: 5.3,
  },
  {
    location: 'Chennai',
    criminalNetworks: 7.5,
    demandCenter: 6.4,
    community: 5.8,
    lawEnforcement: 7.0,
    government: 3.4,
    overallScore: 6.0,
  },
  {
    location: 'Kolkata',
    criminalNetworks: 6.5,
    demandCenter: 5.7,
    community: 4.3,
    lawEnforcement: 5.8,
    government: 2.5,
    overallScore: 5.0,
  },
];

// Detailed metrics by group
export const detailedMetrics = [
  {
    group: 'Criminal Networks',
    metrics: [
      { name: 'Supply Chain Risk', likelihood: 2.8, severity: 2.9, score: 8.1 },
      { name: 'Detection Risk', likelihood: 2.4, severity: 2.7, score: 6.5 },
      { name: 'Market Access Risk', likelihood: 2.7, severity: 3.0, score: 8.1 },
      { name: 'Legal Risk', likelihood: 2.6, severity: 2.9, score: 7.5 },
      { name: 'Financial Risk', likelihood: 2.8, severity: 2.9, score: 8.1 },
    ],
    averageScore: 7.1,
  },
  {
    group: 'Demand Center',
    metrics: [
      { name: 'Supply Chain Risk', likelihood: 2.5, severity: 2.6, score: 6.5 },
      { name: 'Detection Risk', likelihood: 2.3, severity: 2.8, score: 6.4 },
      { name: 'Market Access Risk', likelihood: 2.4, severity: 2.7, score: 6.5 },
      { name: 'Legal Risk', likelihood: 2.2, severity: 2.9, score: 6.4 },
      { name: 'Financial Risk', likelihood: 2.3, severity: 2.7, score: 6.2 },
    ],
    averageScore: 6.4,
  },
];

// Risk trends over time
export const riskTrends = {
  phases: ['Phase 1', 'Phase 2', 'Phase 3'],
  data: {
    criminal: [2.3, 4.7, 7.1],
    demand: [3.1, 5.2, 6.4],
    customers: [2.8, 3.9, 5.1],
    financial: [3.5, 5.1, 6.8],
    law: [4.2, 5.8, 6.7],
    government: [2.2, 2.9, 3.5],
  },
};

// Risk assessment matrix data (Likelihood x Severity)
export const riskMatrix = [
  { metric: 'M1', x: 2, y: 3, z: 6, name: 'Supply Chain Risk' },
  { metric: 'M1', x: 3, y: 2, z: 6, name: 'Detection Risk' },
  { metric: 'M2', x: 1, y: 3, z: 3, name: 'Market Access Risk' },
  { metric: 'M2', x: 2, y: 1, z: 2, name: 'Legal Risk' },
  { metric: 'M3', x: 3, y: 3, z: 9, name: 'Financial Risk' },
  { metric: 'M3', x: 2, y: 2, z: 4, name: 'Operational Risk' },
  { metric: 'M4', x: 3, y: 1, z: 3, name: 'Regulatory Risk' },
  { metric: 'M4', x: 1, y: 2, z: 2, name: 'Reputational Risk' },
];

// Combined risk scores and disruption percentages
export const combinedRiskDisruption = [
  {
    name: 'Criminal Networks',
    riskScore: 7.1,
    disruptionPercentage: 42,
  },
  {
    name: 'Demand Center',
    riskScore: 6.4,
    disruptionPercentage: 35,
  },
  {
    name: 'Community',
    riskScore: 5.1,
    disruptionPercentage: 28,
  },
  {
    name: 'Law Enforcement',
    riskScore: 6.7,
    disruptionPercentage: 48,
  },
  {
    name: 'Government',
    riskScore: 3.5,
    disruptionPercentage: 18,
  },
  {
    name: 'NGO',
    riskScore: 4.8,
    disruptionPercentage: 25,
  },
  {
    name: 'Business',
    riskScore: 5.3,
    disruptionPercentage: 30,
  },
];

// New helper function to ensure likelihood and severity values are within constraints
export const validateMetricsData = (likelihood: number, severity: number) => {
  const validLikelihood = Math.min(5, Math.max(0, likelihood));
  const validSeverity = Math.min(5, Math.max(0, severity));
  
  return {
    likelihood: validLikelihood,
    severity: validSeverity
  };
};
