import React from "react";
import { Card } from "@/components/ui/card";
import { Download, BarChart2, MapPin, Clock, Database, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { BackendStatus } from "./BackendStatus";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[#f5f7fb] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold text-primary">Risk Perception Analysis</h1>
          <p className="text-gray-500">Import and analyze risk perception data across groups and locations</p>
          <BackendStatus className="mt-4" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[
            {
              title: "Upload Data",
              description: "Import survey data from Kobo Toolbox",
              icon: Download,
              color: "bg-blue-50 text-blue-600",
              link: "/upload-data"
            },
            {
              title: "Visualize",
              description: "Generate charts and heatmaps",
              icon: BarChart2,
              color: "bg-purple-50 text-purple-600",
              link: "/visualize"
            },
            {
              title: "Track Locations",
              description: "Monitor hotspots and areas",
              icon: MapPin,
              color: "bg-green-50 text-green-600",
              link: "/locations"
            },
            {
              title: "Track Progress",
              description: "Monitor data timeline",
              icon: Clock,
              color: "bg-amber-50 text-amber-600",
              link: "/track-progress"
            },
            {
              title: "AO Overview",
              description: "Monitor AO datasets",
              icon: Brain,
              color: "bg-pink-50 text-pink-600",
              link: "/ao-overview"
            }
          ].map((item, index) => (
            <Link to={item.link} key={index} className="h-full">
              <Card className="p-6 h-full transition-all hover:shadow-lg cursor-pointer group bg-white">
                <div className={`rounded-full w-12 h-12 ${item.color} flex items-center justify-center mb-4`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm">{item.description}</p>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Data Upload Section */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Upload Survey Data
              </h3>
              <p className="text-sm text-gray-500">
                Import your survey responses from Kobo Toolbox or upload CSV files directly. The system will automatically process and categorize the data.
              </p>
            </div>
          </Card>

          {/* Visualize Results Section */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-purple-600" />
                Visualize Results
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Available visualizations:</p>
                <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                  <li>Metric-wise RP scores</li>
                  <li>Respondent-wise RP scores</li>
                  <li>RP scores across hotspots</li>
                  <li>RP scores across timelines</li>
                  <li>RP scores across AOs</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Track Locations Section */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Track Locations
              </h3>
              <p className="text-sm text-gray-500">
                Location insights in a geospatial map. Monitor risk perception scores across different areas and identify hotspots that need attention.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
