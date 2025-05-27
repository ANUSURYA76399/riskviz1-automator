import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

// Sample data for the locations table
const tableData = [
  { 
    id: 1, 
    area: 'Mumbai', 
    hotspot: 'Chembur', 
    respondents: 42, 
    groups: 6, 
    avgScore: 5.7, 
    riskLevel: 'Medium',
    trend: 'up'
  },
  { 
    id: 2, 
    area: 'Mumbai', 
    hotspot: 'Juhu', 
    respondents: 38, 
    groups: 7, 
    avgScore: 6.2, 
    riskLevel: 'Medium',
    trend: 'up'
  },
  { 
    id: 3, 
    area: 'Delhi', 
    hotspot: 'Saket', 
    respondents: 45, 
    groups: 8, 
    avgScore: 7.1, 
    riskLevel: 'High',
    trend: 'up'
  },
  { 
    id: 4, 
    area: 'Delhi', 
    hotspot: 'Connaught Place', 
    respondents: 53, 
    groups: 9, 
    avgScore: 5.5, 
    riskLevel: 'Medium',
    trend: 'down'
  },
  { 
    id: 5, 
    area: 'Chennai', 
    hotspot: 'T Nagar', 
    respondents: 36, 
    groups: 6, 
    avgScore: 4.8, 
    riskLevel: 'Medium',
    trend: 'stable'
  },
  { 
    id: 6, 
    area: 'Chennai', 
    hotspot: 'Mylapore', 
    respondents: 29, 
    groups: 5, 
    avgScore: 3.1, 
    riskLevel: 'Low',
    trend: 'down'
  },
  { 
    id: 7, 
    area: 'Kolkata', 
    hotspot: 'Park Street', 
    respondents: 41, 
    groups: 7, 
    avgScore: 5.3, 
    riskLevel: 'Medium',
    trend: 'stable'
  },
];

// Function to get risk level color
const getRiskColor = (level: string) => {
  switch (level) {
    case 'Low': return 'text-riskLow';
    case 'Medium': return 'text-riskMedium';
    case 'High': return 'text-riskHigh';
    default: return 'text-gray-500';
  }
};

// Function to get trend icon and color
const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return <span className="text-red-500">↑</span>;
    case 'down': return <span className="text-green-500">↓</span>;
    case 'stable': return <span className="text-gray-500">→</span>;
    default: return null;
  }
};

export const LocationTable = () => {
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Sort the data
  const sortedData = [...tableData].sort((a: any, b: any) => {
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[
              { field: 'area', label: 'Area' },
              { field: 'hotspot', label: 'Hotspot' },
              { field: 'respondents', label: 'Respondents' },
              { field: 'groups', label: 'Groups' },
              { field: 'avgScore', label: 'Avg. Score' },
              { field: 'riskLevel', label: 'Risk Level' },
              { field: 'trend', label: 'Trend' },
            ].map((column) => (
              <th 
                key={column.field}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort(column.field)}
              >
                <div className="flex items-center">
                  {column.label}
                  {sortField === column.field && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {row.area}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {row.hotspot}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {row.respondents}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {row.groups}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {row.avgScore.toFixed(1)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getRiskColor(row.riskLevel)}`}>
                {row.riskLevel}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getTrendIcon(row.trend)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
