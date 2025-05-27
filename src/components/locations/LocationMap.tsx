
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Map, MapPin, ZoomIn, ZoomOut, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import L from 'leaflet';

// Mumbai landmarks with risk data
const mumbaiLocations = [
  { name: 'Chhatrapati Shivaji Terminus', lat: 18.9398, lng: 72.8354, score: 7.2, details: 'High pedestrian traffic area' },
  { name: 'Gateway of India', lat: 18.9220, lng: 72.8347, score: 6.5, details: 'Tourist hotspot with medium risk' },
  { name: 'Dharavi', lat: 19.0380, lng: 72.8538, score: 8.1, details: 'Dense population increases risk factors' },
  { name: 'Bandra-Worli Sea Link', lat: 19.0282, lng: 72.8148, score: 4.3, details: 'Lower risk due to controlled access' },
  { name: 'Juhu Beach', lat: 19.0883, lng: 72.8260, score: 5.6, details: 'Moderate risk in evening hours' },
  { name: 'Nariman Point', lat: 18.9256, lng: 72.8217, score: 3.8, details: 'Commercial area with better security' },
  { name: 'Dadar', lat: 19.0178, lng: 72.8478, score: 6.7, details: 'Transportation hub with elevated risk' },
  { name: 'Powai', lat: 19.1176, lng: 72.9060, score: 2.9, details: 'Relatively low risk area' },
];

// Sample data for the map (other cities for future reference)
const otherLocationData = [
  { name: 'Delhi', lat: 28.613, lng: 77.209, score: 6.3 },
  { name: 'Chennai', lat: 13.083, lng: 80.270, score: 4.9 },
  { name: 'Kolkata', lat: 22.572, lng: 88.363, score: 5.2 },
  { name: 'Bangalore', lat: 12.972, lng: 77.594, score: 3.8 },
];

// Get marker color based on risk score
const getMarkerColor = (score: number) => {
  if (score <= 3) return '#22c55e'; // green
  if (score <= 6) return '#f59e0b'; // amber
  return '#ef4444'; // red
};

export const LocationMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  
  // Create icon for markers
  const createIcon = (score: number) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${getMarkerColor(score)}; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: white; font-weight: bold;">${Math.round(score)}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  // Filter markers by risk level
  const filterMarkersByRisk = (score: number) => {
    if (riskFilter === 'all') return true;
    if (riskFilter === 'low' && score <= 3) return true;
    if (riskFilter === 'medium' && score > 3 && score <= 6) return true;
    if (riskFilter === 'high' && score > 6) return true;
    return false;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    // Create map centered on Mumbai
    map.current = L.map(mapContainer.current).setView([19.0760, 72.8777], 12);
    
    // Add OSM tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map.current);
    
    // Add markers for locations
    const newMarkers: L.Marker[] = [];
    
    mumbaiLocations.forEach(location => {
      if (filterMarkersByRisk(location.score)) {
        const marker = L.marker([location.lat, location.lng], { 
          icon: createIcon(location.score) 
        }).addTo(map.current!);
        
        marker.bindPopup(`
          <div class="p-2">
            <p class="font-medium">${location.name}</p>
            <p class="text-sm">Risk Score: ${location.score}</p>
            <p class="text-xs text-gray-600">${location.details}</p>
          </div>
        `);
        
        newMarkers.push(marker);
      }
    });
    
    setMarkers(newMarkers);
    
    // Add scale control
    L.control.scale().addTo(map.current);
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Update markers when filter changes
  useEffect(() => {
    if (!map.current) return;
    
    // Remove existing markers
    markers.forEach(marker => {
      marker.remove();
    });
    
    // Add filtered markers
    const newMarkers: L.Marker[] = [];
    
    mumbaiLocations.forEach(location => {
      if (filterMarkersByRisk(location.score)) {
        const marker = L.marker([location.lat, location.lng], { 
          icon: createIcon(location.score) 
        }).addTo(map.current!);
        
        marker.bindPopup(`
          <div class="p-2">
            <p class="font-medium">${location.name}</p>
            <p class="text-sm">Risk Score: ${location.score}</p>
            <p class="text-xs text-gray-600">${location.details}</p>
          </div>
        `);
        
        newMarkers.push(marker);
      }
    });
    
    setMarkers(newMarkers);
  }, [riskFilter]);
  
  // Zoom control functions
  const handleZoomIn = () => {
    if (map.current) {
      map.current.setZoom(map.current.getZoom() + 1);
    }
  };
  
  const handleZoomOut = () => {
    if (map.current) {
      map.current.setZoom(map.current.getZoom() - 1);
    }
  };
  
  return (
    <div className="h-[500px] relative bg-blue-50 rounded-lg border border-gray-200">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg"></div>
      
      {/* Map controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Button variant="outline" size="icon" onClick={handleZoomIn} className="bg-white">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleZoomOut} className="bg-white">
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Risk filter */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-md shadow p-2">
        <div className="text-xs font-medium mb-1">Filter by Risk Level</div>
        <select 
          className="text-xs p-1 border rounded w-full"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as any)}
        >
          <option value="all">All Risks</option>
          <option value="low">Low Risk Only</option>
          <option value="medium">Medium Risk Only</option>
          <option value="high">High Risk Only</option>
        </select>
      </div>
      
      {/* Map info tooltip */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-full p-2 shadow-md cursor-help group">
        <Info className="h-4 w-4 text-gray-500" />
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap text-xs w-60">
          <p className="font-medium mb-1">Map Instructions</p>
          <ul className="list-disc pl-4 text-gray-600">
            <li>Click markers to see location details</li>
            <li>Use +/- buttons to zoom in/out</li>
            <li>Filter locations by risk level</li>
            <li>Drag to pan the map</li>
          </ul>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-white p-2 rounded shadow">
        <div className="text-xs font-medium mb-1">Risk Level</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
          <span className="text-xs">Low (1-3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
          <span className="text-xs">Medium (4-6)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
          <span className="text-xs">High (7-9)</span>
        </div>
      </div>
    </div>
  );
};
