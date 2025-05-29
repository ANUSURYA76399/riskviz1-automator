import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useDataContext } from '@/contexts/DataContext';
import DotPlotChart from '@/components/charts/DotPlotChart';

export const MetricScoreSection: React.FC = () => {
  const { chartData } = useDataContext();
  const [selectedHotspots, setSelectedHotspots] = useState<string[]>([]);

  // Get available hotspots from context data
  const availableHotspots = chartData?.uniqueValues?.Hotspot || [];

  // Toggle hotspot selection
  const toggleHotspot = (hotspot: string) => {
    if (selectedHotspots.includes(hotspot)) {
      setSelectedHotspots(selectedHotspots.filter(h => h !== hotspot));
    } else {
      setSelectedHotspots([...selectedHotspots, hotspot]);
    }
  };

  // Prepare filtered data for DotPlotChart
  const filteredData = (chartData?.metricWiseScores || []).filter((row: any) =>
    selectedHotspots.length === 0 || selectedHotspots.includes(row.hotspot)
  );

  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-4">Metric-wise RP Scores across Hotspots</h2>
      {/* Hotspot selection filters */}
      {availableHotspots.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Filter by Hotspot:</h3>
          <div className="flex flex-wrap gap-2">
            {availableHotspots.map((hotspot, index) => (
              <button
                key={`hotspot-${index}`}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedHotspots.includes(hotspot) || selectedHotspots.length === 0
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => toggleHotspot(hotspot)}
              >
                {hotspot}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* The metric score chart */}
      <DotPlotChart data={filteredData} />
      <div className="mt-4 text-sm text-gray-500">
        <p>This chart shows the Risk Perception (RP) scores for different metrics across selected hotspots.</p>
        <p>Click on a hotspot button above to filter the chart. If no hotspots are selected, all will be shown.</p>
      </div>
    </Card>
  );
};

export default MetricScoreSection;
// import { MetricScoreChart } from '@/components/charts/MetricScoreChart'; // REMOVE THIS LINE
