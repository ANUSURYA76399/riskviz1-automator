
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

// Updated phase ranges to match requirements
const phaseRanges = {
  1: { start: 0, end: 24 }, // months
  2: { start: 25, end: 48 },
  3: { start: 49, end: 120 }
};

// Filter timelinePoints based on active phase
const getPhaseTimelinePoints = (phase: number) => {
  return timelinePoints.filter(point => point.phase === phase);
};

const timelinePoints = [
  { months: 3, phase: 1, status: "complete" },
  { months: 6, phase: 1, status: "complete" },
  { months: 12, phase: 1, status: "current" },
  { months: 15, phase: 1, status: "complete" },
  { months: 18, phase: 1, status: "incomplete" },
  { months: 21, phase: 1, status: "incomplete" },
  { months: 24, phase: 1, status: "incomplete" },
  { months: 30, phase: 2, status: "incomplete" },
  { months: 36, phase: 2, status: "incomplete" },
  { months: 48, phase: 2, status: "incomplete" },
  { months: 60, phase: 3, status: "incomplete" },
  { months: 90, phase: 3, status: "incomplete" },
  { months: 120, phase: 3, status: "incomplete" },
];

export const Timeline = ({ activePhase = 1, onPhaseClick, onTimePointClick }) => {
  const navigate = useNavigate();

  // Calculate progress percentage based on completed points
  const completedPoints = timelinePoints.filter(point => point.status === "complete").length;
  const totalPoints = timelinePoints.length;
  const progressPercentage = Math.round((completedPoints / totalPoints) * 100);

  // Filter points to only show those in the active phase
  const visiblePoints = getPhaseTimelinePoints(activePhase);

  const handlePhaseClick = (phase) => {
    if (onPhaseClick) {
      onPhaseClick(phase);
    } else {
      navigate(`/track-progress?phase=${phase}`);
    }
  };

  const handleTimePointClick = (point) => {
    if (onTimePointClick) {
      onTimePointClick(point);
    } else {
      navigate(`/track-progress?months=${point.months}&phase=${point.phase}`);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg">
      <div className="flex justify-between">
        {[1, 2, 3].map(phase => (
          <button
            key={phase}
            onClick={() => handlePhaseClick(phase)}
            className={cn(
              "px-6 py-2 rounded-full font-medium transition-colors border",
              phase === activePhase 
                ? "bg-[#FFF8E1] text-black border-yellow-500 shadow"
                : "bg-gray-500 text-white hover:bg-gray-400 border-transparent"
            )}
          >
            Phase {phase}
            <span className="text-xs block">
              {`(${phaseRanges[phase].start}-${phaseRanges[phase].end} months)`}
              {phase === activePhase && (
                <span className="ml-1 text-yellow-800 font-medium">
                  &nbsp;• {phaseRanges[phase].end - phaseRanges[phase].start + 1} mo
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      <TooltipProvider>
        <div className="relative mt-4">
          <div className="absolute h-0.5 bg-gray-200 w-full top-1/2 -translate-y-1/2" />
          <div className="relative flex justify-between">
            {visiblePoints.map((point, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => handleTimePointClick(point)}
                    className={cn(
                      "flex flex-col items-center gap-2 focus:outline-none group",
                      "cursor-pointer"
                    )}
                  >
                    <div className="relative">
                      <div
                        className={cn(
                          point.status === "complete"
                            ? "w-4 h-4 rounded-full bg-green-500 border-2 border-green-700 group-hover:scale-125 transition-transform"
                            : point.status === "current"
                            ? "w-6 h-6 rounded-full border-4 border-yellow-400 bg-white group-hover:scale-110 transition-transform"
                            : "w-4 h-4 rounded-full bg-gray-400 border-2 border-gray-600 group-hover:scale-125 transition-transform"
                        )}
                      />
                    </div>
                    <span className="text-xs">{point.months} mo</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="p-2">
                    <p className="font-medium">Month {point.months}</p>
                    <p className="capitalize text-sm">{point.status}</p>
                    <p className="text-xs text-gray-500 mt-1">Click for details</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </TooltipProvider>

      <Progress value={progressPercentage} className="h-2" />
      <div className="flex justify-between text-sm text-gray-500">
        <span>Progress: {progressPercentage}% complete</span>
        <span>{completedPoints}/{totalPoints} time points completed</span>
      </div>
    </div>
  );
};
