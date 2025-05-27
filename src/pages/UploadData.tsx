import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, ArrowLeft, FileSpreadsheet, Upload, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import DataCollectionForm from "@/components/upload/DataCollectionForm";
import { downloadSampleTemplate, testSampleData } from "@/utils/sampleData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { uploadFile, checkBackendHealth, getDataPoints, getRiskData } from "@/services/api";
import { useDataContext } from "@/contexts/DataContext";
import { parseUploadedCSV, connectParsedDataToVisualizations } from "@/utils/database/csvExport";

const UploadData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState("");
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [checkingBackend, setCheckingBackend] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setCsvData, processChartData, forceRefreshData } = useDataContext();

  useEffect(() => {
    const checkBackend = async () => {
      try {
        setCheckingBackend(true);
        const isConnected = await checkBackendHealth();
        setBackendConnected(isConnected);
        if (!isConnected) {
          console.warn("Backend server is not available");
        } else {
          console.log("Backend server is connected");
        }
      } catch (error) {
        console.error("Error checking backend connection:", error);
        setBackendConnected(false);
      } finally {
        setCheckingBackend(false);
      }
    };

    checkBackend();
    
    // Check backend connection every 30 seconds
    const interval = setInterval(checkBackend, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setUploadStatus('idle');
    setStatusMessage("");
    
    try {
      toast({
        title: "File selected",
        description: `Processing ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
      });

      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        // Add additional types that might be used by different Excel versions
        'application/vnd.ms-excel.sheet.macroEnabled.12',
        'application/vnd.ms-excel.sheet.binary.macroEnabled.12'
      ];
      
      // Some browsers or systems might not correctly identify the file type
      // So we also check the file extension
      const fileName = file.name.toLowerCase();
      const isValidExtension = fileName.endsWith('.csv') || 
                              fileName.endsWith('.xlsx') || 
                              fileName.endsWith('.xls');
      
      const isValidType = validTypes.includes(file.type) || isValidExtension;
      
      if (!isValidType) {
        throw new Error('Invalid file type. Please upload a CSV or Excel file (.csv, .xlsx, .xls).');
      }

      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 5MB.');
      }

      // Update status
      setStatusMessage("Reading file contents...");

      // Upload to the backend first if connected
      let backendData = null;
      if (backendConnected) {
        try {
          setStatusMessage("Uploading file to backend server...");
          console.log("Uploading file to backend...");
          
          // Upload file to backend
          const uploadResponse = await uploadFile(file);
          console.log("Backend upload response:", uploadResponse);
          
          // Update status
          setStatusMessage("File uploaded successfully. Fetching processed data...");
          
          // Fetch the newly uploaded data from backend
          try {
            // Get file content to determine data type
            const fileReader = new FileReader();
            const fileContent = await new Promise<string>((resolve) => {
              fileReader.onload = (e) => resolve(e.target?.result as string);
              fileReader.readAsText(file);
            });
            
            // Determine which API to call based on file content
            const isRiskData = fileContent.includes('Respondent Type') || 
                               fileContent.includes('Risk Score') || 
                               fileContent.includes('Metric Name') ||
                               fileContent.includes('Hotspot') ||
                               fileContent.includes('AO Location');
            
            if (isRiskData) {
              console.log("Fetching newly uploaded risk data from backend");
              backendData = await getRiskData();
              setStatusMessage(`Successfully processed ${backendData?.length || 0} risk data points`);
            } else {
              console.log("Fetching newly uploaded data points from backend");
              backendData = await getDataPoints();
              setStatusMessage(`Successfully processed ${backendData?.length || 0} data points`);
            }
            console.log("Fetched backend data:", backendData?.length || 0, "items");
          } catch (fetchError) {
            console.error("Error fetching data from backend:", fetchError);
            setStatusMessage("Could not retrieve processed data from backend. Falling back to local processing...");
            // Continue with local processing
          }
        } catch (uploadError) {
          console.error("Error uploading file to backend:", uploadError);
          // Continue with local processing
          setStatusMessage("Backend upload failed. Processing file locally...");
          toast({
            variant: "destructive",
            title: "Backend Upload Failed",
            description: `Using local processing instead. ${uploadError instanceof Error ? uploadError.message : 'Connection error'}`,
          });
        }
      } else {
        console.log("Backend not connected, processing file locally");
        setStatusMessage("Backend not connected. Processing file locally...");
      }

      // Parse the file locally
      setStatusMessage("Parsing file contents...");
      const parsedData = await parseUploadedCSV(file);
      if (!parsedData || parsedData.length === 0) {
        throw new Error('File is empty or could not be read correctly. Please check the file format.');
      }

      // If we have backend data, use that instead of parsed data
      const dataToProcess = backendData || parsedData;

      // Process data for visualization
      setStatusMessage("Processing data for visualization...");
      console.log("Processing data for visualization", dataToProcess.length, "items");
      setCsvData(dataToProcess);
      
      // Process chart data and update context
      const processedChartData = processChartData(dataToProcess);

      console.log("File processed successfully");
      forceRefreshData();
      setUploadStatus('success');
      setStatusMessage(`File processed successfully. ${dataToProcess.length} records imported.`);
      
      // Additional details about the data
      let dataDetails = '';
      if (dataToProcess.length > 0) {
        const firstItem = dataToProcess[0];
        if ('respondent_type' in firstItem) {
          // Define interface for risk data items
          interface RiskDataItem {
            respondent_type: string;
            metric_name: string;
            [key: string]: any; // Allow for other properties
          }
          
          // Count unique respondent types
          const uniqueRespondents = new Set(dataToProcess.map((item: RiskDataItem) => item.respondent_type)).size;
          const uniqueMetrics = new Set(dataToProcess.map((item: RiskDataItem) => item.metric_name)).size;
          dataDetails = `Imported ${uniqueRespondents} respondent types and ${uniqueMetrics} metrics.`;
        }
      }
      
      toast({
        title: "Upload Complete",
        description: `${dataToProcess.length} records imported successfully. ${dataDetails}`,
      });
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadStatus('error');
      setStatusMessage(error instanceof Error ? error.message : "An unknown error occurred");
      toast({
        title: "Error uploading file",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTestSampleData = async () => {
    setIsLoading(true);
    setUploadStatus('idle');
    
    try {
      toast({
        title: "Loading sample data",
        description: "Processing sample risk data for visualization",
      });

      // Get sample data from utility function
      const sampleData = await testSampleData();
      
      if (!sampleData || !Array.isArray(sampleData) || sampleData.length === 0) {
        throw new Error('Failed to load sample data');
      }
      
      // Process data locally for visualization
      console.log("Processing sample data for visualization");
      setCsvData(sampleData);
      const formattedChartData = connectParsedDataToVisualizations(sampleData);
      if (formattedChartData) {
        processChartData(sampleData);
        console.log("Sample data processed for visualization");
      }
      
      // Force refresh to update charts
      forceRefreshData();
      
      setUploadStatus('success');
      setStatusMessage(`Successfully processed ${sampleData.length} sample data entries.`);
      toast({
        title: "Sample data loaded",
        description: `Processed ${sampleData.length} sample entries`,
      });
    } catch (error) {
      console.error("Error loading sample data:", error);
      setUploadStatus('error');
      setStatusMessage(error instanceof Error ? error.message : "An unknown error occurred");
      toast({
        title: "Error loading sample data",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to map respondent types to enum values
  const mapRespondentTypeToEnum = (respondentType: string): string => {
    const typeMap: Record<string, string> = {
      "criminal networks": "Criminal Networks",
      "law enforcement": "Law Enforcement",
      "community": "Community",
      "government": "Government",
      "ngo": "NGO",
      "business": "Business",
      "security": "Security",
      "demand center": "Demand Center"
    };
    
    const normalizedType = respondentType.toLowerCase().trim();
    
    for (const [key, value] of Object.entries(typeMap)) {
      if (normalizedType.includes(key)) {
        return value;
      }
    }
    
    // Default to Community if no match found
    return "Community";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-primary">Upload Data</h1>
        </div>
        
        <p className="text-gray-500">
          Import your survey data from Kobo Toolbox or upload CSV/Excel files for analysis.
        </p>

        {backendConnected === false && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Backend Server Not Available</AlertTitle>
            <AlertDescription>
              The backend server is not available. Data will only be processed locally and will not be saved to the server.
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    setCheckingBackend(true);
                    const isConnected = await checkBackendHealth();
                    setBackendConnected(isConnected);
                    setCheckingBackend(false);
                  }}
                  disabled={checkingBackend}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${checkingBackend ? 'animate-spin' : ''}`} />
                  {checkingBackend ? 'Checking...' : 'Check Connection'}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {backendConnected === true && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Backend Server Connected</AlertTitle>
            <AlertDescription className="text-green-600">
              The backend server is available. Uploaded data will be processed and saved to the server.
            </AlertDescription>
          </Alert>
        )}

        <DataCollectionForm />

        {uploadStatus !== 'idle' && (
          <Alert variant={uploadStatus === 'error' ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{uploadStatus === 'error' ? "Error" : "Success"}</AlertTitle>
            <AlertDescription>
              {statusMessage}
            </AlertDescription>
          </Alert>
        )}

        <Card className="p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Import from Kobo Toolbox</h2>
            <p className="text-gray-500 text-sm">
              Connect directly to your Kobo Toolbox account to import survey responses.
            </p>
            <div className="flex gap-4">
              <Input type="text" placeholder="Kobo Toolbox API Token" className="flex-1" />
              <Button>Connect</Button>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h2 className="text-xl font-semibold">Upload File</h2>
            <p className="text-gray-500 text-sm">
              Upload CSV or Excel files with survey data. Files should include respondent groups, metrics, and response values.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-lg font-medium mb-1">Drag and drop your files here</p>
                <p className="text-gray-500 text-sm mb-4">or browse from your computer</p>
                <Input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  disabled={isLoading}
                />
                <Button 
                  variant="secondary" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Browse Files
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h2 className="text-xl font-semibold">Sample Data</h2>
            <p className="text-gray-500 text-sm">
              Not sure how to format your data? Download our sample template or test with sample data.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={downloadSampleTemplate}>
                Download Sample Template
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleTestSampleData} 
                disabled={isLoading}
              >
                {isLoading ? "Testing..." : "Test Sample Data"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UploadData;
