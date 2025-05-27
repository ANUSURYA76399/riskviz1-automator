import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { checkBackendHealth } from '@/services/api';

interface BackendStatusProps {
  className?: string;
}

export function BackendStatus({ className }: BackendStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    try {
      setIsChecking(true);
      const connected = await checkBackendHealth();
      setIsConnected(connected);
    } catch (error) {
      console.error('Error checking backend connection:', error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) {
    return (
      <Alert className={`flex items-center ${className}`}>
        <RefreshCw className="h-4 w-4 animate-spin" />
        <AlertTitle className="ml-2">Checking backend status...</AlertTitle>
      </Alert>
    );
  }

  return (
    <Alert variant={isConnected ? "default" : "destructive"} className={`flex items-center ${className}`}>
      {isConnected ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <div className="ml-2 flex-grow">
        <AlertTitle>{isConnected ? "Backend Status: Connected" : "Backend Status: Disconnected"}</AlertTitle>
        <AlertDescription>
          {isConnected 
            ? "The backend server is running and connected." 
            : "Failed to connect to backend. Data will not be saved or retrieved from the server."}
        </AlertDescription>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={checkConnection}
        disabled={isChecking}
        className="ml-2"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
        {isChecking ? 'Checking...' : 'Check'}
      </Button>
    </Alert>
  );
}
