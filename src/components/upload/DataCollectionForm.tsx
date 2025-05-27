
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const respondentGroups = [
  "Criminal Networks/Traffickers",
  "Demand Center Operators",
  "Transporters", 
  "Customers",
  "Financial Networks",
  "Law Enforcement Officers",
  "Community/Vulnerable community",
  "Digital/Virtual Community",
  "Survivors/Families of Survivors",
  "Lawyers"
];

const aoLocations = ["Mumbai", "Bangalore", "Kolkata"];
const hotspots = ["Hotspot 1", "Hotspot 2", "Hotspot 3"];
const phases = ["1", "2", "3"];
const timelines = [
  "3 months", "6 months", "9 months", "12 months",
  "15 months", "18 months", "120 months (3 month gap)"
];

interface DataCollectionFormProps {
  onParamsChange?: (params: {
    group: string;
    location: string;
    hotspot: string;
    phase: string;
    timeline: string[];
  }) => void;
}

const DataCollectionForm = ({ onParamsChange }: DataCollectionFormProps = {}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedHotspot, setSelectedHotspot] = useState<string>("");
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [selectedTimelines, setSelectedTimelines] = useState<string[]>([]);

  const handleChange = (field: string, value: string | string[]) => {
    let newState: any = {};
    
    switch (field) {
      case 'group':
        setSelectedGroup(value as string);
        newState.group = value;
        break;
      case 'location':
        setSelectedLocation(value as string);
        newState.location = value;
        break;
      case 'hotspot':
        setSelectedHotspot(value as string);
        newState.hotspot = value;
        break;
      case 'phase':
        setSelectedPhase(value as string);
        newState.phase = value;
        break;
      case 'timeline':
        setSelectedTimelines(value as string[]);
        newState.timeline = value;
        break;
    }
    
    if (onParamsChange) {
      onParamsChange({
        group: field === 'group' ? value as string : selectedGroup,
        location: field === 'location' ? value as string : selectedLocation,
        hotspot: field === 'hotspot' ? value as string : selectedHotspot,
        phase: field === 'phase' ? value as string : selectedPhase,
        timeline: field === 'timeline' ? value as string[] : selectedTimelines,
      });
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Data Collection Parameters</h3>
        <p className="text-sm text-muted-foreground">
          *only Data Analysts will be able to upload
        </p>
        <p className="text-sm text-muted-foreground">
          *uploading of files will be AO specific (limited access to users)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Label>Respondent Group</Label>
          {/* Single select for Respondent Group */}
          <Select value={selectedGroup} onValueChange={(value) => handleChange('group', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              {respondentGroups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label>AO Location</Label>
          <Select value={selectedLocation} onValueChange={(value) => handleChange('location', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {aoLocations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label>Hotspot</Label>
          <Select value={selectedHotspot} onValueChange={(value) => handleChange('hotspot', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select hotspot" />
            </SelectTrigger>
            <SelectContent>
              {hotspots.map((hotspot) => (
                <SelectItem key={hotspot} value={hotspot}>
                  {hotspot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label>Phase</Label>
          <Select value={selectedPhase} onValueChange={(value) => handleChange('phase', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select phase" />
            </SelectTrigger>
            <SelectContent>
              {phases.map((phase) => (
                <SelectItem key={phase} value={phase}>
                  {phase}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label>Timeline</Label>
          {/* Multi-select for Timeline */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedTimelines.length === 0 
                  ? 'Select timeline' 
                  : `${selectedTimelines.length} selected`}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Timeline Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {timelines.map((timeline) => (
                <DropdownMenuCheckboxItem
                  key={timeline}
                  checked={selectedTimelines.includes(timeline)}
                  onCheckedChange={(checked) => {
                    const newTimelines = checked
                      ? [...selectedTimelines, timeline]
                      : selectedTimelines.filter(t => t !== timeline);
                    handleChange('timeline', newTimelines);
                  }}
                >
                  {timeline}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="pt-4 border-t">
        <p className="text-sm text-red-600 mb-4">
          FOR THE MAIN STUDY: AN INBUILT DATA COLLECTION TOOL INSTEAD OF KOBO
        </p>
        <p className="text-sm text-gray-600">
          Have to include names of hotspots - Research Analysts - which will automatically update all slides
        </p>
      </div>
    </Card>
  );
};

export default DataCollectionForm;
