import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/ui/StatCard";
import ProjectCard from "@/components/ui/ProjectCard";
import { useProjects, useLaunchpad } from "@/contexts/LaunchpadContext";
import { getPublicProjects, type IdoProjectData } from "@/services/api";

interface ActivityItem {
  user: string;
  action: string;
  project: string;
  amount: string;
  time: string;
  timestamp: number; // Counter value, not milliseconds
}

const Home = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const [publicProjects, setPublicProjects] = useState<IdoProjectData[]>([]);
  const [liveActivity, setLiveActivity] = useState<ActivityItem[]>([]);
  
  // Use real data from LaunchpadContext
  const { projects } = useProjects();
  const { isConnected, loading, globalCounter, api } = useLaunchpad();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load public projects when not connected
  useEffect(() => {
    if (!isConnected) {
      const loadPublicProjects = async () => {
        try {
          const publicProjectsData = await getPublicProjects();
          setPublicProjects(publicProjectsData);
        } catch (err) {
          console.error('Failed to load public projects for home:', err);
        }
      };
      
      loadPublicProjects();
    }
  }, [isConnected]);

  // Load live activity data
  useEffect(() => {
    const loadLiveActivity = async () => {
      if (!api) return;
      
      try {
        const allProjectsData = isConnected && projects.length > 0 ? projects : publicProjects;
        const activeProjects = allProjectsData.filter(project => project.status === 'ACTIVE');
        
        let projectsToQuery = activeProjects;
        
        // If no active projects, find the ended project with latest end time
        if (activeProjects.length === 0) {
          const endedProjects = allProjectsData.filter(project => project.status === 'ENDED');
          if (endedProjects.length > 0) {
            // Sort by endTime descending (latest end time first) and take the first one
            const latestEndedProject = endedProjects.sort((a, b) => parseInt(b.endTime) - parseInt(a.endTime))[0];
            projectsToQuery = [latestEndedProject];
          } else {
            // No projects at all
            setLiveActivity([]);
            return;
          }
        }

        // Get investment history for projects to query
        const allInvestments = [];
        for (const project of projectsToQuery.slice(0, 3)) { // Limit to 3 projects for performance
          try {
            const investments = await api.getProjectInvestments(project.projectId);
            const formattedInvestments = investments.map(investment => ({
              user: `${investment.pid[0]?.slice(-4) || '????'}...${investment.pid[1]?.slice(-4) || '????'}`,
              action: "invested",
              project: project.tokenSymbol,
              amount: `${new Intl.NumberFormat('en-US').format(parseFloat(investment.amount))} USDT`,
              time: formatTimeAgo(parseInt(investment.timestamp)), // timestamp is counter value
              timestamp: parseInt(investment.timestamp) // Keep as counter for sorting
            }));
            allInvestments.push(...formattedInvestments);
          } catch (error) {
            console.warn(`Failed to load investments for project ${project.projectId}:`, error);
          }
        }

        // Sort by counter (newest first = higher counter) and take top 4
        const sortedActivity = allInvestments
          .sort((a, b) => b.timestamp - a.timestamp) // Higher counter = more recent
          .slice(0, 4);
        
        setLiveActivity(sortedActivity);
      } catch (error) {
        console.error('Failed to load live activity:', error);
        // Keep existing activity or use fallback
      }
    };

    loadLiveActivity();
    
    // Refresh live activity every 30 seconds
    const interval = setInterval(loadLiveActivity, 30000);
    return () => clearInterval(interval);
  }, [api, projects, publicProjects, isConnected]);

  // Helper function to format time ago using global counter
  const formatTimeAgo = (investmentCounter: number): string => {
    if (!globalCounter || globalCounter === 0) {
      // Fallback to estimate if no global counter available
      const now = Math.floor(Date.now() / 1000);
      const estimatedCurrentCounter = Math.floor(now / 5);
      const diff = (estimatedCurrentCounter - investmentCounter) * 5;
      
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    }
    
    // Use real global counter: (current counter - investment counter) * 5 = seconds ago
    const counterDiff = globalCounter - investmentCounter;
    const secondsAgo = counterDiff * 5;
    
    if (secondsAgo < 0) return "just now"; // Future investment (shouldn't happen)
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
  };

  // Use connected user projects or public projects
  const activeProjects = isConnected && projects.length > 0 ? projects : publicProjects;

  // Calculate stats from real data
  const stats = {
    totalProjects: activeProjects.length.toString(),
    totalRaised: activeProjects.reduce((sum, p) => sum + parseFloat(p.totalRaised || "0"), 0).toLocaleString(),
    activeInvestors: activeProjects.reduce((sum, p) => sum + parseInt(p.totalInvestors || "0"), 0).toLocaleString(),
    avgRoi: activeProjects.length > 0 ? "+145%" : "0%" // Placeholder calculation
  };

  // Get featured projects (first 3 projects)
  const featuredProjects = activeProjects.slice(0, 3).map(project => ({
    projectId: project.projectId,
    projectName: project.projectName || `${project.tokenSymbol} Project`,
    tokenSymbol: project.tokenSymbol,
    description: project.description || "Example project description",
    targetAmount: project.targetAmount,
    totalRaised: project.totalRaised,
    totalInvestors: project.totalInvestors,
    startTime: project.startTime, // Keep as counter value
    endTime: project.endTime, // Keep as counter value
    status: project.status,
    isOverSubscribed: project.isOverSubscribed,
    progress: project.progress,
    maxIndividualCap: project.maxIndividualCap || "0",
    tokenPrice: project.tokenPrice || "0",
    tokenSupply: project.tokenSupply || "0"
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,0,0.1),transparent_70%)]"></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="space-y-6 animate-fadeIn">
            <h1 className="text-4xl md:text-6xl font-bold font-mono text-gradient-rainbow animate-glow">
              zkCross Launchpad
            </h1>
            <p className="text-xl md:text-2xl font-mono text-muted-foreground max-w-3xl mx-auto">
              THE ULTIMATE IDO PLATFORM Built with ZKWASM
            </p>
            <p className="text-lg font-mono text-foreground/80 max-w-2xl mx-auto">
              Invest in cutting-edge Web3 projects with USDT. 
              Dynamic allocation, fair withdrawals, zero fees.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button 
                className="btn-pixel text-lg px-8 py-3"
                onClick={() => navigate('/projects')}
              >
                EXPLORE PROJECTS
              </Button>
              <Button 
                className="btn-pixel-secondary text-lg px-8 py-3"
                onClick={() => navigate('/dashboard')}
              >
                ENTER DASHBOARD
              </Button>
            </div>
          </div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary animate-pixel-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Projects"
              value={stats.totalProjects}
              change="+3 this week"
              changeType="positive"
              className="animate-fadeIn"
            />
            <StatCard
              title="Total Raised"
              value={`$${stats.totalRaised}`}
              change="+12.5% this month"
              changeType="positive" 
              className="animate-fadeIn"
            />
            <StatCard
              title="Active Investors"
              value={stats.activeInvestors}
              change="+234 this week"
              changeType="positive"
              className="animate-fadeIn"
            />
            <StatCard
              title="Average ROI"
              value={stats.avgRoi}
              change="Last 30 days"
              changeType="positive"
              className="animate-fadeIn"
            />
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-mono text-gradient-primary mb-4">
              FEATURED PROJECTS
            </h2>
            <p className="text-lg font-mono text-muted-foreground">
              Hot IDOs ready for investment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project, index) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                globalCounter={globalCounter}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              className="btn-pixel-accent text-lg px-8 py-3"
              onClick={() => navigate('/projects')}
            >
              VIEW ALL PROJECTS
            </Button>
          </div>
        </div>
      </section>

      {/* Live Activity Feed */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-mono text-gradient-secondary mb-4">
              LIVE ACTIVITY
            </h2>
            <p className="text-lg font-mono text-muted-foreground">
              Real-time platform activity
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {liveActivity.length > 0 ? liveActivity.map((activity, index) => (
              <div key={index} className="card-pixel p-4 animate-slideInRight" style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pixel-pulse"></div>
                    <div className="font-mono text-sm">
                      <span className="text-accent">{activity.user}</span>
                      <span className="text-muted-foreground"> {activity.action} {activity.amount} in </span>
                      <span className="text-primary font-semibold">{activity.project}</span>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <div className="w-8 h-8 bg-muted rounded-full mx-auto mb-4 animate-pixel-pulse"></div>
                <p className="font-mono text-sm text-muted-foreground">
                  {api ? "No recent investment activity" : "Loading live activity..."}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Real-time Status */}
      <section className="py-8 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success rounded-full animate-pixel-pulse"></div>
                <span className="font-mono text-sm text-success">TESTNET LIVE</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-pixel-pulse"></div>
                <span className="font-mono text-sm text-primary">REALTIME DATA</span>
              </div>
            </div>
            <div className="font-mono text-sm text-muted-foreground">
              Last updated: {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;