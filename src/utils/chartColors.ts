
export const getScoreColor = (score: number): string => {
  // Precise 9-color scale from dark green to dark red
  if (score < 1) return '#006400'; // Default dark green for invalid values
  if (score < 2) return '#006400'; // Dark green (1)
  if (score < 3) return '#90EE90'; // Light green (2)
  if (score < 4) return '#C1FFC1'; // Very light green (3)
  if (score < 5) return '#FFFFE0'; // Light yellow (4)
  if (score < 6) return '#FEF7CD'; // Soft yellow (5)
  if (score < 7) return '#FFB347'; // Light orange (6)
  if (score < 8) return '#FFA07A'; // Light red (7)
  if (score < 9) return '#FF6347'; // Darker orange-red (8)
  return '#8B0000'; // Dark red (9)
};

// Color scale with labels for legend
export const riskColorScale = [
  { value: 1, color: '#006400', label: 'Low' },  // Dark green
  { value: 2, color: '#90EE90', label: 'Low' },  // Light green
  { value: 3, color: '#C1FFC1', label: 'Low' },  // Very light green
  { value: 4, color: '#FFFFE0', label: 'Moderate' }, // Light yellow
  { value: 5, color: '#FEF7CD', label: 'Moderate' }, // Soft yellow
  { value: 6, color: '#FFB347', label: 'Moderate' }, // Light orange
  { value: 7, color: '#FFA07A', label: 'High' },  // Light red
  { value: 8, color: '#FF6347', label: 'High' },  // Darker orange-red
  { value: 9, color: '#8B0000', label: 'High' },  // Dark red
];

export const getTextColor = (backgroundColor: string): string => {
  const darkBackgrounds = ['#FF6347', '#8B0000', '#006400'];
  return darkBackgrounds.includes(backgroundColor) ? '#ffffff' : '#1a1a1a';
};
