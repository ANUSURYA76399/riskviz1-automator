
import { DetailedMetric } from "@/hooks/use-risk-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDataContext } from "@/contexts/DataContext";

interface DataTableProps {
  data: DetailedMetric[] | any[];
  loading: boolean;
}

export function DataTable({ data, loading }: DataTableProps) {
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const { uploadId } = useDataContext();
  const [averageRiskScore, setAverageRiskScore] = useState<string>("N/A");

  // Reset pagination when data changes
  useEffect(() => {
    setPage(0);
  }, [data, uploadId]);

  // Calculate average risk score
  useEffect(() => {
    if (data && data.length > 0) {
      const scores = data
        .filter(row => {
          const score = row["Risk Score"] || row.score || row["RP Score"] || row["Score"];
          return score !== undefined && score !== null && !isNaN(parseFloat(String(score)));
        })
        .map(row => parseFloat(String(row["Risk Score"] || row.score || row["RP Score"] || row["Score"])));

      if (scores.length === 0) {
        setAverageRiskScore("N/A");
      } else {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        setAverageRiskScore(avg.toFixed(2));
      }
    } else {
      setAverageRiskScore("N/A");
    }
  }, [data]);

  const totalPages = Math.ceil((data?.length || 0) / rowsPerPage);
  const startIndex = page * rowsPerPage;
  const displayData = data?.slice(startIndex, startIndex + rowsPerPage) || [];

  // Helper function to safely format numeric values
  const formatNumber = (value: any): string => {
    if (value === undefined || value === null) return 'N/A';
    
    // Check if it's a numeric value that can be formatted
    const num = Number(value);
    if (!isNaN(num)) {
      return num.toFixed(1);
    }
    
    // Return as string if it's not a number
    return String(value);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Data Table</h3>
        <div className="bg-blue-50 px-4 py-2 rounded-md">
          <span className="text-sm text-gray-700">Average Risk Score: </span>
          <span className="font-bold text-blue-700">{averageRiskScore}</span>
        </div>
      </div>

      <Table className="border">
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Metric Name</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Likelihood</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Phase</TableHead>
            <TableHead>Respondent Type</TableHead>
            <TableHead>Hotspot</TableHead>
            <TableHead>AO</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4">
                Loading data...
              </TableCell>
            </TableRow>
          ) : displayData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4">
                No data available
              </TableCell>
            </TableRow>
          ) : (
            displayData.map((row, index) => (
              <TableRow key={row.id || `row-${index}-${uploadId}`}>
                <TableCell>{row.metric_name || row['Metric Name'] || row['Metric'] || 'N/A'}</TableCell>
                <TableCell>{formatNumber(row.score || row['Risk Score'] || row['RP Score'] || row['Score'])}</TableCell>
                <TableCell>{formatNumber(row.likelihood || row['Likelihood'])}</TableCell>
                <TableCell>{formatNumber(row.severity || row['Severity'])}</TableCell>
                <TableCell>{row.phase || row['Phase'] || 'N/A'}</TableCell>
                <TableCell>{row.respondent_type || row['Respondent Type'] || row['Respondent Group'] || 'N/A'}</TableCell>
                <TableCell>{row.hotspot_name || row['Hotspot'] || 'N/A'}</TableCell>
                <TableCell>{row.ao_name || row['AO Location'] || row['AO'] || 'N/A'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            Showing {data?.length ? Math.min(data.length, startIndex + 1) : 0}-{data?.length ? Math.min(data.length, startIndex + rowsPerPage) : 0} of {data?.length || 0} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-sm mx-2">
              Page {page + 1} of {Math.max(1, totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
