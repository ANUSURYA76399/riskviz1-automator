import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Filter, 
  RefreshCw, 
  Search, 
  SortAsc, 
  Users,
  BrainCircuit,
  Check,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
  Lightbulb 
} from "lucide-react";
import { Link } from "react-router-dom";
import { GroupComparison } from "@/components/groups/GroupComparison";
import { GroupDetail } from "@/components/groups/GroupDetail";
import { useState } from "react";

interface GroupData {
  name: string;
  phase1: number;
  phase2: number;
  phase3: number;
}

interface Insight {
  icon: "Check" | "AlertCircle" | "ArrowUpRight" | "Info";
  text: string;
  color: string;
  confidence?: "High" | "Medium" | "Low";
}

interface Recommendation {
  text: string;
  rationale: string;
  priority: "High" | "Medium" | "Low";
}

interface SignificantChange {
  groupName: string;
  change: number;
  explanation: string;
  confidence: "High" | "Medium" | "Low";
}

interface GroupsProps {
  allGroups: string[];
  locations: string[];
  phases: string[];
  groupData: GroupData[];
  initialSelectedGroup?: string;
  generateGroupComparisonInsights: (groups: string[]) => Insight[];
  generateGroupRecommendations: (group: string) => Recommendation[];
  getSignificantChanges: () => SignificantChange[];
  getHighestRiskGroup: () => { name: string; score: number };
  getLowestRiskGroup: () => { name: string; score: number };
  getNotableChanges: () => { name: string; change: number }[];
}

const Groups = ({
  allGroups,
  locations,
  phases,
  groupData,
  initialSelectedGroup = "",
  generateGroupComparisonInsights,
  generateGroupRecommendations,
  getSignificantChanges,
  getHighestRiskGroup,
  getLowestRiskGroup,
  getNotableChanges
}: GroupsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [showPhaseComparison, setShowPhaseComparison] = useState(false);
  const [sortBy, setSortBy] = useState<"alphabetical" | "score">("alphabetical");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedPhase, setSelectedPhase] = useState(phases[0] || "");
  const [selectedGroup, setSelectedGroup] = useState(initialSelectedGroup || allGroups[0] || "");
  
  const comparisonInsights = generateGroupComparisonInsights(
    selectedGroups.length > 0 ? selectedGroups : allGroups.slice(0, 2)
  );
  
  const recommendations = generateGroupRecommendations(selectedGroup);
  const significantChanges = getSignificantChanges();
  const highestRiskGroup = getHighestRiskGroup();
  const lowestRiskGroup = getLowestRiskGroup();
  const notableChanges = getNotableChanges();

  const filteredGroups = allGroups.filter(group => 
    group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleGroupSelection = (group: string) => {
    if (selectedGroups.includes(group)) {
      setSelectedGroups(selectedGroups.filter(g => g !== group));
    } else {
      setSelectedGroups([...selectedGroups, group]);
    }
  };

  const selectAllGroups = () => {
    if (selectedGroups.length === filteredGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups([...filteredGroups]);
    }
  };

  const getTrendDirection = (groupName: string) => {
    const group = groupData.find(g => g.name === groupName);
    if (!group) return "stable";
    
    const phase2 = group.phase2;
    const phase3 = group.phase3;
    
    if (phase3 > phase2) return "up";
    if (phase3 < phase2) return "down";
    return "stable";
  };

  const getTrendIcon = (groupName: string) => {
    const direction = getTrendDirection(groupName);
    
    switch (direction) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-riskHigh" />;
      case "down":
        return <ArrowDown className="h-4 w-4 text-riskLow" />;
      default:
        return <span className="h-4 w-4">→</span>;
    }
  };

  if (!allGroups.length) {
    return <div className="min-h-screen bg-gray-50 p-8">No groups data available</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-up">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-primary hover:text-primary/80">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-primary">Compare Groups</h1>
        </div>
        
        <p className="text-gray-500">
          Analyze and compare risk perception scores across different respondent groups.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="p-6 col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Group Selection</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={selectAllGroups}
                className="text-xs h-8"
              >
                {selectedGroups.length === filteredGroups.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                type="text" 
                placeholder="Search groups..." 
                className="w-full pl-8 pr-4 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col gap-2 mb-4 max-h-[320px] overflow-y-auto">
              {filteredGroups.map((group, index) => (
                <div 
                  key={index} 
                  className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                  onClick={() => toggleGroupSelection(group)}
                >
                  <Checkbox 
                    id={`group-${index}`}
                    checked={selectedGroups.includes(group)}
                    onCheckedChange={() => toggleGroupSelection(group)}
                    className="mr-2"
                  />
                  <label 
                    htmlFor={`group-${index}`}
                    className="flex items-center text-sm cursor-pointer flex-1"
                  >
                    <Users className="h-4 w-4 text-primary mr-2" />
                    <span>{group}</span>
                  </label>
                  {getTrendIcon(group)}
                </div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">View Options</h3>
                <Button variant="ghost" size="sm" onClick={() => {
                  setSortBy("alphabetical");
                  setShowPhaseComparison(false);
                }}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Reset
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Checkbox 
                    id="phase-comparison"
                    checked={showPhaseComparison}
                    onCheckedChange={() => setShowPhaseComparison(!showPhaseComparison)}
                    className="mr-2"
                  />
                  <label htmlFor="phase-comparison" className="text-sm cursor-pointer">
                    Show Phase Comparison
                  </label>
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="text-sm flex items-center">
                    <input 
                      type="radio" 
                      name="sort" 
                      className="mr-2"
                      checked={sortBy === "alphabetical"}
                      onChange={() => setSortBy("alphabetical")}
                    />
                    Alphabetical
                  </label>
                  <label className="text-sm flex items-center">
                    <input 
                      type="radio" 
                      name="sort" 
                      className="mr-2"
                      checked={sortBy === "score"}
                      onChange={() => setSortBy("score")}
                    />
                    By Score
                  </label>
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <Button variant="outline" size="sm" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Group Data
            </Button>
          </Card>

          <div className="col-span-1 lg:col-span-3 space-y-6">
            <Tabs defaultValue="comparison">
              <TabsList>
                <TabsTrigger value="comparison">Group Comparison</TabsTrigger>
                <TabsTrigger value="detail">Group Detail</TabsTrigger>
                <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="comparison" className="mt-4">
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Group Comparison</h2>
                    <div className="flex gap-2">
                      <select 
                        className="rounded-md border border-gray-300 p-2 text-sm"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                      >
                        <option>All Locations</option>
                        {locations.map((location, index) => (
                          <option key={index}>{location}</option>
                        ))}
                      </select>
                      <select 
                        className="rounded-md border border-gray-300 p-2 text-sm"
                        value={selectedPhase}
                        onChange={(e) => setSelectedPhase(e.target.value)}
                      >
                        {phases.map((phase, index) => (
                          <option key={index}>{phase}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <GroupComparison 
                    selectedGroups={selectedGroups.length > 0 ? selectedGroups : filteredGroups}
                    sortBy={sortBy}
                    showPhaseComparison={showPhaseComparison}
                    data={groupData}
                  />
                </Card>
              </TabsContent>
              
              <TabsContent value="detail" className="mt-4">
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Group Detail</h2>
                    <div className="flex gap-2">
                      <select 
                        className="rounded-md border border-gray-300 p-2 text-sm"
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                      >
                        {allGroups.map((group, index) => (
                          <option key={index}>{group}</option>
                        ))}
                      </select>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                    </div>
                  </div>
                  <GroupDetail 
                    selectedGroup={selectedGroup} 
                    phaseData={groupData.map(group => ({
                      subject: group.name,
                      phase1: group.phase1,
                      phase2: group.phase2,
                      phase3: group.phase3,
                      fullMark: 10
                    }))}
                    metrics={[]} 
                    locationData={[]} 
                    averageScore={0} 
                  />
                </Card>
              </TabsContent>
              
              <TabsContent value="analysis" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-6 border-blue-200 bg-blue-50">
                    <CardHeader className="px-0 pt-0">
                      <div className="flex items-center gap-2 mb-2">
                        <BrainCircuit className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-lg">Similarity Analysis</CardTitle>
                      </div>
                      <p className="text-sm text-gray-600">
                        AI-detected patterns and similarities between selected groups
                      </p>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      <div className="space-y-4">
                        {comparisonInsights.map((insight, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-md shadow-sm">
                            <div className="flex items-start gap-2">
                              {insight.icon === "Check" && <Check className={`h-4 w-4 mt-0.5 ${insight.color}`} />}
                              {insight.icon === "AlertCircle" && <AlertCircle className={`h-4 w-4 mt-0.5 ${insight.color}`} />}
                              {insight.icon === "ArrowUpRight" && <ArrowUpRight className={`h-4 w-4 mt-0.5 ${insight.color}`} />}
                              {insight.icon === "Info" && <AlertCircle className={`h-4 w-4 mt-0.5 ${insight.color}`} />}
                              <div className="flex-1">
                                <p className="text-sm">{insight.text}</p>
                                {insight.confidence && (
                                  <div className="flex justify-end mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      insight.confidence === 'High' 
                                        ? 'bg-green-100 text-green-800' 
                                        : insight.confidence === 'Medium'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {insight.confidence} confidence
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-6">
                    <CardHeader className="px-0 pt-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-5 w-5 text-amber-500" />
                        <CardTitle className="text-lg">Suggested Actions</CardTitle>
                      </div>
                      <p className="text-sm text-gray-600">
                        Recommended actions for {selectedGroup}
                      </p>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      <div className="space-y-4">
                        {recommendations.map((rec, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-md">
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${
                                  rec.priority === 'High' 
                                    ? 'bg-red-500' 
                                    : rec.priority === 'Medium'
                                    ? 'bg-amber-500'
                                    : 'bg-blue-500'
                                }`}></div>
                                <span className={`text-xs font-medium ${
                                  rec.priority === 'High' 
                                    ? 'text-red-500' 
                                    : rec.priority === 'Medium'
                                    ? 'text-amber-500'
                                    : 'text-blue-500'
                                }`}>
                                  {rec.priority} priority
                                </span>
                              </div>
                              <Button variant="ghost" size="sm" className="h-6 text-xs">
                                Assign
                              </Button>
                            </div>
                            <Separator />
                            <div className="p-3">
                              <p className="font-medium text-sm">{rec.text}</p>
                              <p className="text-xs text-gray-500 mt-1">{rec.rationale}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="p-6 mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <h3 className="font-medium">Significant Changes Explained</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {significantChanges.map((change, index) => (
                      <div key={index} className="border border-gray-200 rounded-md overflow-hidden">
                        <div className="bg-gray-50 p-3 border-b border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{change.groupName}</span>
                            <span className={`font-medium ${
                              change.change > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {change.change > 0 ? '+' : ''}{change.change}
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-sm">{change.explanation}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">Detected by AI analysis</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              change.confidence === 'High' 
                                ? 'bg-green-100 text-green-800' 
                                : change.confidence === 'Medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {change.confidence} confidence
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Highest Risk Group</h3>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-riskHigh/20 flex items-center justify-center mr-3">
                    <Users className="w-6 h-6 text-riskHigh" />
                  </div>
                  <div>
                    <p className="font-semibold">{highestRiskGroup.name}</p>
                    <p className="text-sm text-gray-500">Avg. Score: {highestRiskGroup.score.toFixed(1)}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Lowest Risk Group</h3>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-riskLow/20 flex items-center justify-center mr-3">
                    <Users className="w-6 h-6 text-riskLow" />
                  </div>
                  <div>
                    <p className="font-semibold">{lowestRiskGroup.name}</p>
                    <p className="text-sm text-gray-500">Avg. Score: {lowestRiskGroup.score.toFixed(1)}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Significant Changes</h3>
                <div className="space-y-2">
                  {notableChanges.map((change, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{change.name}</span>
                      <span className={`text-sm ${
                        change.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {change.change > 0 ? '+' : ''}{change.change.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Groups;