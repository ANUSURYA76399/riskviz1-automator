// API service for connecting to the Express backend
const API_BASE_URL = "http://localhost:4000";

// Function to check if backend is available
export async function checkBackendHealth(): Promise<boolean> {
  try {
    console.log(`Checking backend health at ${API_BASE_URL}/health`);
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Backend health check:', data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

// Interface for risk data
export interface RiskDataPoint {
  id?: number;
  respondent_type: string;
  hotspot: string;
  ao_location: string;
  phase: number;
  risk_score: number;
  likelihood: number;
  severity: number;
  risk_level: string;
  metric_name: string;
  timeline: string;
  created_at?: string;
}

export async function sendSurveyResponse(data: any) {
  const response = await fetch(`${API_BASE_URL}/api/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return await response.json();
}

// File upload function to send files to the Express backend
export async function uploadFile(file: File) {
  try {
    // Create a properly structured FormData with explicit boundary handling
    const formData = new FormData();
    
    // Append the file with explicit filename to prevent issues
    formData.append('file', file, file.name);
    
    // Log file details before upload
    console.log(`Uploading file to ${API_BASE_URL}/upload`, {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)} KB`
    });
    
    // Use AbortController to set a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      // Using root endpoint for backward compatibility
      method: 'POST',
      body: formData,
      signal: controller.signal,
      // Prevent browser from setting Content-Type header
      headers: {
        // Let the browser set the appropriate multipart boundary
        // Explicitly NOT setting Content-Type allows browser to handle it correctly
      }
    });
    
    // Clear the timeout since the request completed
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      // Try to get a more detailed error message from the response body
      try {
        const errorData = await response.json();
        throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
    }
    
    const result = await response.json();
    console.log('Upload successful:', result);
    return result;
  } catch (error: any) {
    // Handle specific error types
    if (error.name === 'AbortError') {
      console.error('File upload timed out');
      throw new Error('File upload timed out. Please try again with a smaller file or check your connection.');
    }
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Fetch risk data from the backend
export async function getRiskData(): Promise<RiskDataPoint[]> {
  try {
    console.log(`Fetching risk data from ${API_BASE_URL}/api/risk-data`);
    const response = await fetch(`${API_BASE_URL}/api/risk-data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch risk data: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Received ${data.length} risk data points from backend`);
    return data;
  } catch (error) {
    console.error('Error fetching risk data:', error);
    throw error;
  }
}

// Clear all risk data from the backend
export async function clearRiskData() {
  try {
    console.log(`Clearing risk data at ${API_BASE_URL}/api/risk-data`);
    const response = await fetch(`${API_BASE_URL}/api/risk-data`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to clear risk data: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error clearing risk data:', error);
    throw error;
  }
}

// Get data points from the backend
export async function getDataPoints() {
  try {
    console.log(`Fetching data points from ${API_BASE_URL}/api/points`);
    const response = await fetch(`${API_BASE_URL}/api/points`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data points: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Received ${data.length} data points from backend`);
    return data;
  } catch (error) {
    console.error('Error fetching data points:', error);
    throw error;
  }
}

// Add a new data point
export async function addDataPoint(x: number, y: number) {
  try {
    console.log(`Adding data point to ${API_BASE_URL}/api/points`, { x, y });
    const response = await fetch(`${API_BASE_URL}/api/points`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ x, y })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add data point: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding data point:', error);
    throw error;
  }
}
