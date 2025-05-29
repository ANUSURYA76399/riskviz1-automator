import { ArrowLeft, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Timeline } from "@/components/progress/Timeline";
import { HotspotList, Hotspot as HotspotListItem } from "@/components/progress/HotspotList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Types
type RespondentGroup = string;
type HotspotStatus = "complete" | "partially-complete" | "incomplete";

interface Hotspot {
  id: string;
  name: string;
  location: string;
  status: HotspotStatus;
  groups: string;
  completedGroups?: RespondentGroup[];
  pendingGroups?: RespondentGroup[];
}

interface Location {
  name: string;
  hotspots: Hotspot[];
}

const userRole = "analyst"; // This would typically come from auth context

const allRespondentGroups = [
  "Criminal Networks",
  "Demand Center",
  "Transporters",
  "Customers",
  "Financial Networks",
  "Law Enforcement",
  "Community",
  "Digital Community",
  "Survivors",
  "Lawyers"
];

const TrackProgress = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [activePhase, setActivePhase] = useState(1);
  const [activeTimePoint, setActiveTimePoint] = useState<string | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<HotspotStatus>("incomplete");
  const [selectedGroups, setSelectedGroups] = useState<RespondentGroup[]>([]);

  // Fetch locations data
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        // Replace with actual API call
        // const response = await fetch('/api/locations');
        // const data = await response.json();
        
        // Simulating API call
        await new Promise(resolve => setTimeout(resolve, 500));
        // In a real app, you would use the data from the API response
        const mockData: Location[] = []; // Empty array to start with
        
        setLocations(mockData);
        if (mockData.length > 0) {
          setSelectedCity(mockData[0].name);
        }
      } catch (err) {
        setError("Failed to load location data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Handle URL params
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

  const handlePhaseClick = (phase: number) => {
    setActivePhase(phase);
    setActiveTimePoint(null);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("phase", phase.toString());
    newSearchParams.delete("months");
    setSearchParams(newSearchParams);
  };

  const handleTimePointClick = (point: { phase: number; months: string }) => {
    setActivePhase(point.phase);
    setActiveTimePoint(point.months);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("phase", point.phase.toString());
    newSearchParams.set("months", point.months.toString());
    setSearchParams(newSearchParams);
  };

  const selectedCityData = locations.find(loc => loc.name === selectedCity);
  const shownHotspots = selectedCityData?.hotspots.filter(hotspot => {
    // In a real app, you might filter by phase or other criteria
    return true;
  }) || [];

  // Function to handle hotspot selection
  const handleHotspotSelect = (hotspot: HotspotListItem) => {
    // Convert back to our local Hotspot type if needed
    const localHotspot: Hotspot = {
      ...hotspot,
      id: String(hotspot.id), // Convert number id back to string for our local type
      location: hotspot.location || '',
      groups: hotspot.groups
    };
    setSelectedHotspot(localHotspot);
    setSelectedStatus(localHotspot.status);
    setSelectedGroups(localHotspot.completedGroups || []);
    setUpdateDialogOpen(true);
  };

  const handleGroupToggle = (group: RespondentGroup) => {
    setSelectedGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const handleStatusUpdate = async () => {
    if (!selectedHotspot) return;

    try {
      setIsLoading(true);
      // Replace with actual API call
      // await fetch(`/api/hotspots/${selectedHotspot.id}`, {
      //   method: 'PUT',
      //   body: JSON.stringify({
      //     status: selectedStatus,
      //     completedGroups: selectedGroups
      //   })
      // });

      // Update local state optimistically
      setLocations(prev => prev.map(location => ({
        ...location,
        hotspots: location.hotspots.map(hotspot => 
          hotspot.id === selectedHotspot.id
            ? {
                ...hotspot,
                status: selectedStatus,
                completedGroups: selectedGroups,
                pendingGroups: allRespondentGroups.filter(g => !selectedGroups.includes(g)),
                groups: selectedStatus === "complete" 
                  ? "All respondent groups"
                  : selectedStatus === "partially-complete"
                    ? `${selectedGroups.length}/${allRespondentGroups.length} respondent groups`
                    : "No data collected"
              }
            : hotspot
        )
      })));

      setUpdateDialogOpen(false);
    } catch (err) {
      setError("Failed to update hotspot status");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && locations.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  if (locations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">No locations available</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
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
              onValueChange={setSelectedCity}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(location => (
                  <SelectItem key={location.name} value={location.name}>
                    {location.name}
                  </SelectItem>
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
                        <Button 
                          onClick={() => setUpdateDialogOpen(true)}
                          disabled={isLoading || shownHotspots.length === 0}
                        >
                          Update Collection Status
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          Update the collection status for each hotspot and respondent group.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>

            {shownHotspots.length > 0 ? (
              <>
                <HotspotList 
                  hotspots={shownHotspots.map(hotspot => ({
                    ...hotspot,
                    id: parseInt(hotspot.id) || 0, // Convert string id to number
                    // Ensure other properties match the expected format
                    status: hotspot.status as "complete" | "partially-complete" | "incomplete"
                  }))} 
                  onHotspotSelect={userRole === "analyst" ? 
                    // Use an inline function to ensure type compatibility
                    (hotspot: HotspotListItem) => handleHotspotSelect(hotspot) 
                    : undefined
                  }
                />

                <div className="mt-6 bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm">Complete - Data from all respondent groups collected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-sm">Partially Complete - Data from some respondent groups collected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="text-sm">Incomplete - No data collected</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No hotspots available for the selected city and phase
              </div>
            )}
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
                  <Select 
                    value={selectedHotspot?.id || ""}
                    onValueChange={(value) => {
                      const hotspot = shownHotspots.find(h => h.id === value);
                      if (hotspot) {
                        setSelectedHotspot(hotspot);
                        setSelectedStatus(hotspot.status);
                        setSelectedGroups(hotspot.completedGroups || []);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Hotspot" />
                    </SelectTrigger>
                    <SelectContent>
                      {shownHotspots.map(hotspot => (
                        <SelectItem key={hotspot.id} value={hotspot.id}>
                          {hotspot.name} - {hotspot.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select 
                    value={selectedStatus}
                    onValueChange={(value: HotspotStatus) => setSelectedStatus(value)}
                  >
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
                      {allRespondentGroups.map(group => (
                        <div key={group} className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id={`group-${group}`}
                            checked={selectedGroups.includes(group)}
                            onChange={() => handleGroupToggle(group)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            disabled={selectedStatus === "incomplete"}
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
              <Button 
                variant="outline" 
                onClick={() => setUpdateDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleStatusUpdate}
                disabled={isLoading || !selectedHotspot}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TrackProgress;