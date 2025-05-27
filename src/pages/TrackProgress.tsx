import { ArrowLeft, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Timeline } from "@/components/progress/Timeline";
import { HotspotList } from "@/components/progress/HotspotList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const userRole = "analyst"; // Options: "analyst", "user", "admin"

const locations = [
  { 
    name: "Mumbai", 
    hotspots: [
      { id: 1, name: "HOTSPOT 1", location: "Chembur", status: "complete", groups: "All respondent groups" },
      { id: 2, name: "HOTSPOT 2", location: "Dharavi", status: "complete", groups: "All respondent groups" },
      { id: 3, name: "HOTSPOT 3", location: "Andheri", status: "complete", groups: "All respondent groups" },
      { id: 5, name: "HOTSPOT 5", location: "Bandra", status: "partially-complete", groups: "7/10 respondent groups", 
        completedGroups: ["Criminal Networks", "Demand Center", "Transporters", "Customers", "Financial Networks", "Law Enforcement", "Community"],
        pendingGroups: ["Digital Community", "Survivors", "Lawyers"] 
      },
    ]
  },
  { 
    name: "Delhi", 
    hotspots: [
      { id: 2, name: "HOTSPOT 2", location: "Chandni Chowk", status: "complete", groups: "All respondent groups" },
      { id: 3, name: "HOTSPOT 3", location: "Connaught Place", status: "partially-complete", groups: "8/10 respondent groups", 
        completedGroups: ["Criminal Networks", "Demand Center", "Transporters", "Customers", "Financial Networks", "Law Enforcement", "Community", "Digital Community"],
        pendingGroups: ["Survivors", "Lawyers"]
      },
      { id: 4, name: "HOTSPOT 4", location: "Dwarka", status: "incomplete", groups: "No data collected" },
    ]
  },
  { 
    name: "Chennai", 
    hotspots: [
      { id: 1, name: "HOTSPOT 1", location: "T Nagar", status: "partially-complete", groups: "5/10 respondent groups", 
        completedGroups: ["Criminal Networks", "Demand Center", "Transporters", "Financial Networks", "Law Enforcement"],
        pendingGroups: ["Customers", "Community", "Digital Community", "Survivors", "Lawyers"]
      },
      { id: 4, name: "HOTSPOT 4", location: "Anna Nagar", status: "incomplete", groups: "No data collected" },
      { id: 6, name: "HOTSPOT 6", location: "Velachery", status: "incomplete", groups: "No data collected" },
    ]
  },
  { 
    name: "Kolkata", 
    hotspots: [
      { id: 2, name: "HOTSPOT 2", location: "Park Street", status: "complete", groups: "All respondent groups" },
      { id: 3, name: "HOTSPOT 3", location: "Salt Lake", status: "partially-complete", groups: "6/10 respondent groups", 
        completedGroups: ["Criminal Networks", "Demand Center", "Transporters", "Law Enforcement", "Community", "Digital Community"],
        pendingGroups: ["Customers", "Financial Networks", "Survivors", "Lawyers"]
      },
    ]
  },
];

const TrackProgress = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const [activePhase, setActivePhase] = useState(1);
  const [activeTimePoint, setActiveTimePoint] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  useEffect(() => {
    const phaseParam = searchParams.get("phase");
    const monthsParam = searchParams.get("months");

    if (phaseParam) {
      setActivePhase(parseInt(phaseParam));
    }
    if (monthsParam) {
      setActiveTimePoint(monthsParam);
    }
  }, [searchParams]);

  const handlePhaseClick = (phase) => {
    setActivePhase(phase);
    setActiveTimePoint(null);
    searchParams.set("phase", phase.toString());
    searchParams.delete("months");
    setSearchParams(searchParams);
  };

  const handleTimePointClick = (point) => {
    setActivePhase(point.phase);
    setActiveTimePoint(point.months);
    searchParams.set("phase", point.phase.toString());
    searchParams.set("months", point.months.toString());
    setSearchParams(searchParams);
  };

  const selectedCityData = locations.find(loc => loc.name === selectedCity) || locations[0];

  let shownHotspots = [];
  if (activePhase === 1) {
    shownHotspots = [
      { id: 1, name: "HOTSPOT 1", location: "Chembur", status: "complete", groups: "All respondent groups" },
      { id: 2, name: "HOTSPOT 2", location: "Dharavi", status: "complete", groups: "All respondent groups" },
      { id: 3, name: "HOTSPOT 3", location: "Andheri", status: "complete", groups: "All respondent groups" },
      { id: 5, name: "HOTSPOT 5", location: "Bandra", status: "partially-complete", groups: "7/10 respondent groups",
        completedGroups: ["Criminal Networks", "Demand Center", "Transporters", "Customers", "Financial Networks", "Law Enforcement", "Community"],
        pendingGroups: ["Digital Community", "Survivors", "Lawyers"] 
      },
    ];
  } else if (activePhase === 2) {
    shownHotspots = [
      { id: 2, name: "HOTSPOT 2", location: "Chandni Chowk", status: "complete", groups: "All respondent groups" },
      { id: 3, name: "HOTSPOT 3", location: "Connaught Place", status: "partially-complete", groups: "8/10 respondent groups",
        completedGroups: ["Criminal Networks", "Demand Center", "Transporters", "Customers", "Financial Networks", "Law Enforcement", "Community", "Digital Community"],
        pendingGroups: ["Survivors", "Lawyers"]
      },
      { id: 4, name: "HOTSPOT 4", location: "Dwarka", status: "incomplete", groups: "No data collected" },
    ];
  } else {
    shownHotspots = [
      { id: 1, name: "HOTSPOT 1", location: "T Nagar", status: "partially-complete", groups: "5/10 respondent groups",
        completedGroups: ["Criminal Networks", "Demand Center", "Transporters", "Financial Networks", "Law Enforcement"],
        pendingGroups: ["Customers", "Community", "Digital Community", "Survivors", "Lawyers"]
      },
      { id: 4, name: "HOTSPOT 4", location: "Anna Nagar", status: "incomplete", groups: "No data collected" },
      { id: 6, name: "HOTSPOT 6", location: "Velachery", status: "incomplete", groups: "No data collected" },
    ];
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Risk Perception Analysis</h1>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Data Collection Progress Tracker</h2>
            <Select 
              value={selectedCity}
              onValueChange={(value) => setSelectedCity(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(location => (
                  <SelectItem key={location.name} value={location.name}>{location.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Timeline 
            activePhase={activePhase}
            onPhaseClick={handlePhaseClick}
            onTimePointClick={handleTimePointClick}
          />

          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Hotspot Data Collection Status</h3>
              <div className="flex gap-4">
                {userRole === "analyst" && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={() => setUpdateDialogOpen(true)}>
                          Update Collection Status
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          Update the collection status for each hotspot and respondent group. <br />
                          <b>How it works:</b> Use the dropdown to mark individual respondent groups as complete or pending for each hotspot.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>

            <HotspotList hotspots={shownHotspots} />

            <div className="mt-6 bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Complete - Data from all respondent groups collected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Partially Complete - Data from 1-9 respondent groups collected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm">Incomplete - No data collected</span>
              </div>
              <p className="text-sm italic">Note: If any hotspot is incomplete, the entire AO is considered partially complete</p>
            </div>
          </div>
        </div>
      </div>

      {userRole === "analyst" && (
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Collection Status</DialogTitle>
              <DialogDescription>
                Mark respondent groups as complete for each hotspot.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Select Hotspot</label>
                  <Select defaultValue="hotspot1">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Hotspot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotspot1">HOTSPOT 1 - Chembur</SelectItem>
                      <SelectItem value="hotspot2">HOTSPOT 2 - Dharavi</SelectItem>
                      <SelectItem value="hotspot3">HOTSPOT 3 - Andheri</SelectItem>
                      <SelectItem value="hotspot5">HOTSPOT 5 - Bandra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select defaultValue="partially-complete">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="complete">Complete</SelectItem>
                      <SelectItem value="partially-complete">Partially Complete</SelectItem>
                      <SelectItem value="incomplete">Incomplete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Completed Respondent Groups</label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    <div className="space-y-2">
                      {["Criminal Networks", "Demand Center", "Transporters", "Customers", "Financial Networks", 
                        "Law Enforcement", "Community", "Digital Community", "Survivors", "Lawyers"].map(group => (
                        <div key={group} className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id={`group-${group}`} 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                            defaultChecked={["Criminal Networks", "Demand Center", "Transporters", "Customers", "Financial Networks", "Law Enforcement", "Community"].includes(group)}
                          />
                          <label htmlFor={`group-${group}`} className="text-sm">{group}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setUpdateDialogOpen(false)}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TrackProgress;
