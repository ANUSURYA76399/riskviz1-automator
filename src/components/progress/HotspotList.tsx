
import { cn } from "@/lib/utils";
import { CircleCheck, Info } from "lucide-react";
import { useState } from "react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { RespondentGroupsDialog } from "./RespondentGroupsDialog";

type HotspotStatus = "complete" | "partially-complete" | "incomplete";

export interface Hotspot {
  id: number;
  name: string;
  location?: string;
  status: HotspotStatus;
  groups: string;
  completedGroups?: string[];
  pendingGroups?: string[];
}

interface HotspotListProps {
  hotspots: Hotspot[];
  onHotspotSelect?: (hotspot: Hotspot) => void;
}

const getStatusColor = (status: HotspotStatus) => {
  switch (status) {
    case "complete":
      return "bg-green-50 border-green-200";
    case "partially-complete":
      return "bg-yellow-50 border-yellow-200";
    case "incomplete":
      return "bg-gray-50 border-gray-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
};

const getStatusIcon = (status: HotspotStatus) => {
  switch (status) {
    case "complete":
      return <CircleCheck className="w-6 h-6 text-green-500" />;
    case "partially-complete":
      return <Info className="w-6 h-6 text-yellow-500" />;
    default:
      return null;
  }
};

export const HotspotList = ({ hotspots, onHotspotSelect }: HotspotListProps) => {
  const [dialogOpenHotspot, setDialogOpenHotspot] = useState<number | null>(null);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {hotspots.map((hotspot) => (
          <div
            key={hotspot.id}
            className={cn(
              "p-4 rounded-lg border",
              getStatusColor(hotspot.status)
            )}
          >
            <div className="flex justify-between items-start">
              <div className="w-full">
                <h3 className="font-medium">
                  {hotspot.name}
                  {hotspot.location ? ` - ${hotspot.location}` : ''}
                </h3>
                <div className="flex items-center gap-1">
                  <p className="text-sm text-gray-600 capitalize">{hotspot.status}</p>
                  {hotspot.status === "partially-complete" && hotspot.completedGroups && hotspot.pendingGroups && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          title="View Respondent Groups Status"
                          className="focus:outline-none ml-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDialogOpenHotspot(hotspot.id);
                          }}
                          type="button"
                        >
                          <Info className="h-4 w-4 text-yellow-500 cursor-pointer hover:text-yellow-700" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View respondent groups details</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{hotspot.groups}</p>
              </div>
              {getStatusIcon(hotspot.status)}
            </div>
            
            {hotspot.status === "partially-complete" && hotspot.completedGroups && hotspot.pendingGroups && (
              <RespondentGroupsDialog
                open={dialogOpenHotspot === hotspot.id}
                onOpenChange={() => setDialogOpenHotspot(null)}
                completedGroups={hotspot.completedGroups}
                pendingGroups={hotspot.pendingGroups}
              />
            )}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
};
