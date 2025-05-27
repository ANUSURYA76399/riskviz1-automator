
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Filter, MapPin, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { LocationMap } from "@/components/locations/LocationMap";
import { LocationTable } from "@/components/locations/LocationTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const Locations = () => {
  const [selectedLocation, setSelectedLocation] = useState("Mumbai");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-primary hover:text-primary/80">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-primary">Location Tracking</h1>
          </div>
          <select 
            className="rounded-md border border-gray-300 p-2"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option>Mumbai</option>
            <option>Delhi</option>
            <option>Chennai</option>
            <option>Kolkata</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Sidebar */}
          <Card className="p-4 md:w-1/4 space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search locations..." 
                className="w-full pl-8 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Areas of Operation</h3>
                <Button variant="ghost" size="sm" className="h-8 gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                </Button>
              </div>
              <div className="mt-2 space-y-1">
                {["Mumbai", "Delhi", "Chennai", "Kolkata"].map((area, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer ${selectedLocation === area ? 'bg-gray-100' : ''}`}
                    onClick={() => setSelectedLocation(area)}
                  >
                    <MapPin className="h-4 w-4 text-primary mr-2" />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium">Hotspots</h3>
              <div className="mt-2 space-y-1 pl-6">
                {[
                  {area: "Mumbai", hotspots: ["Chembur", "Juhu", "Andheri"]},
                  {area: "Delhi", hotspots: ["Saket", "Connaught Place"]}
                ].map((areaData) => 
                  areaData.hotspots.map((hotspot, index) => (
                    <div 
                      key={index} 
                      className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                    >
                      <span className="h-2 w-2 bg-primary rounded-full mr-2"></span>
                      <span>{hotspot}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button className="w-full">Add New Location</Button>
          </Card>

          {/* Main Content */}
          <div className="md:w-3/4">
            <Card className="p-6">
              <Tabs defaultValue="map" className="w-full">
                <TabsList className="w-full bg-yellow-100 p-1 rounded-lg">
                  <TabsTrigger 
                    value="map" 
                    className="flex-1 data-[state=active]:bg-white rounded-md transition-colors"
                  >
                    Map View
                  </TabsTrigger>
                  <TabsTrigger 
                    value="table" 
                    className="flex-1 data-[state=active]:bg-white rounded-md transition-colors"
                  >
                    Table View
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="map" className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Risk Perception Map</h2>
                  <LocationMap />
                </TabsContent>
                <TabsContent value="table" className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Location Data</h2>
                  <LocationTable />
                </TabsContent>
              </Tabs>
            </Card>

            {/* Location Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-2">Location Insights</h3>
                <div className="space-y-2">
                  <p className="text-3xl font-bold">5.8</p>
                  <p className="text-sm text-green-600">+0.8 from last phase</p>
                  <p className="text-sm text-gray-500">Average RP Score</p>
                </div>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-2">High Risk Perception</h3>
                <div className="space-y-2">
                  <p className="font-medium">Criminal Networks</p>
                  <p className="text-sm text-gray-500">Respective RP Score will be displayed here</p>
                </div>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-2">Risk Trend</h3>
                <p className="text-sm text-gray-500">Increased/Decreased in phase 2 (relative timelines)</p>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-2">Data Insights</h3>
                <ul className="text-sm text-gray-500 list-disc pl-4 space-y-1">
                  <li>Highest RP</li>
                  <li>Lowest RP groups</li>
                  <li>Both points hotspot wise</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Locations;
