import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/ui/StatCard";
import ProjectCard from "@/components/ui/ProjectCard";
import { useProjects, useLaunchpad } from "@/contexts/LaunchpadContext";
import { useWallet } from "@/contexts/WalletContext";
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
  const walletContext = useWallet();
  const { isConnected: walletConnected, isL2Connected, l1Account, l2Account } = walletContext;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load public projects when not connected
  useEffect(() => {
    if (!isConnected && globalCounter > 0) {
      const loadPublicProjects = async () => {
        try {
          const publicProjectsData = await getPublicProjects(globalCounter);
          setPublicProjects(publicProjectsData);
        } catch (err) {
          console.error('Failed to load public projects for home:', err);
        }
      };
      
      loadPublicProjects();
    }
  }, [isConnected, globalCounter]);

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
              amount: `${new Intl.NumberFormat('en-US').format(parseFloat(investment.amount))} points (~$${(parseFloat(investment.amount) / 100000).toFixed(2)} USDT equivalent)`,
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

  // Calculate Average ROI based on LP model: 20% tokens + 50% funds
  const calculateAverageROI = (projects: any[]) => {
    const activeProjects = projects.filter(p => p.status === 'ACTIVE' || p.status === 'ENDED');
    
    if (activeProjects.length === 0) return "0%";
    
    const totalROI = activeProjects.reduce((sum, project) => {
      const targetAmount = parseFloat(project.targetAmount || "0");
      const tokenSupply = parseFloat(project.tokenSupply || "0");
      
      if (targetAmount === 0 || tokenSupply === 0) return sum;
      
      // IDO price per token (80% supply for 100% target)
      const distributableSupply = tokenSupply * 0.8;
      const idoPricePerToken = targetAmount / distributableSupply;
      
      // LP price per token (20% tokens + 50% funds)
      const lpTokens = tokenSupply * 0.2;
      const lpFunds = targetAmount * 0.5;
      const lpPricePerToken = lpFunds / lpTokens;
      
      // ROI = (LP Price - IDO Price) / IDO Price * 100
      const roi = ((lpPricePerToken - idoPricePerToken) / idoPricePerToken) * 100;
      return sum + roi;
    }, 0);
    
    const averageROI = totalROI / activeProjects.length;
    return `${averageROI >= 0 ? '+' : ''}${averageROI.toFixed(1)}%`;
  };

  // Calculate stats from real data
  const stats = {
    totalProjects: activeProjects.length.toString(),
    totalRaised: activeProjects.reduce((sum, p) => sum + parseFloat(p.totalRaised || "0"), 0).toLocaleString(),
    activeInvestors: activeProjects.reduce((sum, p) => sum + parseInt(p.totalInvestors || "0"), 0).toLocaleString(),
    avgRoi: calculateAverageROI(activeProjects)
  };

  // Get featured projects (first 3 projects)
  const featuredProjects = activeProjects.slice(0, 3).map(project => ({
    projectId: project.projectId,
    projectName: project.projectName || `${project.tokenSymbol} Project`,
    tokenSymbol: project.tokenSymbol,
                description: project.description || "No project description",
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
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Enhanced cyberpunk background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(139,69,255,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(0,149,255,0.1),transparent_50%)]"></div>
        
        {/* Floating cosmic orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Primary Purple Orb */}
          <div className="absolute top-1/4 left-1/4 w-20 h-20 animate-float">
            <div className="w-20 h-20 bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-full blur-sm opacity-60"></div>
          </div>
          
          {/* Secondary Blue Orb */}
          <div className="absolute top-1/3 right-1/4 w-16 h-16 animate-float" style={{ animationDelay: '-2s' }}>
            <div className="w-16 h-16 bg-gradient-to-br from-secondary via-secondary/80 to-secondary/60 rounded-full blur-sm opacity-50"></div>
          </div>
          
          {/* Accent Orb */}
          <div className="absolute bottom-1/3 left-1/3 w-12 h-12 animate-float" style={{ animationDelay: '-4s' }}>
            <div className="w-12 h-12 bg-gradient-to-br from-accent via-accent/80 to-accent/60 rounded-full blur-sm opacity-40"></div>
          </div>
        </div>


        {/* Dynamic Motion Particle System */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Complex Movement Orbs */}
          {[...Array(8)].map((_, i) => {
            const animationClass = i % 4 === 0 ? 'animate-drift-horizontal' : 
                                 i % 4 === 1 ? 'animate-drift-vertical' : 
                                 i % 4 === 2 ? 'animate-cross-movement' : 'animate-spiral-motion';
            return (
              <div
                key={`orb-${i}`}
                className={`absolute ${animationClass}`}
                style={{
                  left: `${15 + (i * 12) % 70}%`,
                  top: `${15 + (i * 15) % 70}%`,
                  animationDelay: `${i * 1.5}s`,
                  animationDuration: `${8 + (i % 3) * 3}s`
                }}
              >
                <div 
                  className={`rounded-full blur-sm ${
                    i % 3 === 0 ? 'bg-primary/20' : 
                    i % 3 === 1 ? 'bg-secondary/18' : 'bg-accent/15'
                  }`}
                  style={{
                    width: `${14 + (i % 4) * 6}px`,
                    height: `${14 + (i % 4) * 6}px`,
                  }}
                ></div>
              </div>
            );
          })}

          {/* Fast Orbiting Particles */}
          {[...Array(4)].map((_, i) => (
            <div
              key={`fast-orbit-${i}`}
              className="absolute animate-orbit-slow"
              style={{
                left: `${25 + (i * 20) % 50}%`,
                top: `${25 + (i * 18) % 50}%`,
                animationDelay: `${i * 3}s`,
                animationDuration: `${8 + i * 2}s`
              }}
            >
              <div 
                className={`w-3 h-3 rounded-full ${
                  i % 2 === 0 ? 'bg-primary/50' : 'bg-secondary/40'
                } blur-sm`}
              ></div>
            </div>
          ))}

          {/* Spiral Motion Particles */}
          {[...Array(3)].map((_, i) => (
            <div
              key={`spiral-${i}`}
              className="absolute animate-spiral-motion"
              style={{
                left: `${40 + i * 25}%`,
                top: `${30 + i * 20}%`,
                animationDelay: `${i * 4}s`,
                animationDuration: `${12 + i * 3}s`
              }}
            >
              <div 
                className={`w-2 h-2 rounded-full ${
                  i === 0 ? 'bg-primary/60' : 
                  i === 1 ? 'bg-secondary/50' : 'bg-accent/40'
                }`}
              ></div>
            </div>
          ))}
          
          {/* Dynamic Twinkling Stars */}
          {[...Array(25)].map((_, i) => {
            const size = 1 + (i % 3);
            return (
              <div
                key={`star-${i}`}
                className="absolute animate-twinkle-smooth"
                style={{
                  left: `${(i * 13) % 90 + 5}%`,
                  top: `${(i * 17) % 75 + 12}%`,
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: `${4 + (i % 5)}s`
                }}
              >
                <div 
                  className={`rounded-full ${
                    i % 4 === 0 ? 'bg-primary' :
                    i % 4 === 1 ? 'bg-secondary' :
                    i % 4 === 2 ? 'bg-accent' : 'bg-foreground/60'
                  }`}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    filter: 'blur(0.2px)'
                  }}
                ></div>
              </div>
            );
          })}
          
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="space-y-8 animate-fadeIn">
            <h1 className="text-5xl md:text-7xl font-bold text-gradient-primary">
              zkCross Launchpad
            </h1>
            <p className="text-xl md:text-2xl text-cyber-blue max-w-3xl mx-auto font-medium">
              The Next-Generation IDO Platform
            </p>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto leading-relaxed">
              Invest in cutting-edge zkCross projects with{" "}🪙
              <span className="relative inline-flex items-center gap-1 group">
                <span className="text-cyber-pink underline decoration-cyber-pink/50 decoration-2 underline-offset-4 cursor-pointer transition-all duration-200 hover:decoration-cyber-pink group-hover:text-cyber-pink/90">
                  ZKWASM Points
                </span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-card/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-80">
                  <div className="text-sm text-foreground font-medium leading-relaxed">
                    <p className="mb-2">Stake your tokens to earn ZKWASM Points, then withdraw to your wallet and deposit to Launchpad.</p>
                    <p className="text-cyber-pink font-semibold cursor-pointer hover:text-cyber-pink/80 transition-colors" 
                       onClick={() => window.open('https://staking.zkwasm.ai/', '_blank')}>
                      Click to Stake →
                    </p>
                  </div>
                  {/* Tooltip Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border/50"></div>
                </div>
              </span>. 
              Dynamic allocation, instant withdrawals, zero fees.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <Button 
                className="btn-cyber min-w-[200px]"
                onClick={() => navigate('/projects')}
              >
                Explore Projects
              </Button>
              <Button 
                className="btn-cyber-secondary min-w-[200px]"
                onClick={() => navigate('/dashboard')}
              >
                {walletConnected && isL2Connected ? 'View Dashboard' : 
                 walletConnected ? 'Connect Launchpad' : 'Connect Wallet'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Projects"
              value={stats.totalProjects}
              className="animate-fadeIn"
            />
            <StatCard
              title="Total Raised"
              value={`${stats.totalRaised} points`}
              className="animate-fadeIn"
            />
            <StatCard
              title="Active Investors"
              value={stats.activeInvestors}
              className="animate-fadeIn"
            />
            <StatCard
              title="Average ROI"
              value={stats.avgRoi}
              className="animate-fadeIn"
            />
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-cyber-teal mb-4">
              Featured Projects
            </h2>
            <p className="text-lg text-muted-foreground font-medium">
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
              className="btn-cyber-secondary"
              size="lg"
              onClick={() => navigate('/projects')}
            >
              View All Projects
            </Button>
          </div>
        </div>
      </section>

      {/* Live Activity Feed */}
      <section className="py-16 px-4 bg-muted/30 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-cyber-pink mb-4">
              Live Activity
            </h2>
            <p className="text-lg text-foreground/90 font-medium">
              Real-time platform activity
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {liveActivity.length > 0 ? liveActivity.map((activity, index) => (
              <div key={index} className="card-glass p-4 animate-slideInUp hover-lift" style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full glow-primary"></div>
                    <div className="text-sm">
                      <span className="text-secondary font-mono">{activity.user}</span>
                      <span className="text-muted-foreground"> {activity.action} {activity.amount} in </span>
                      <span className="text-primary font-semibold">{activity.project}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {activity.time}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-4 glow-primary flex items-center justify-center">
                  <div className="w-6 h-6 bg-card rounded-full"></div>
                </div>
                <p className="text-sm text-muted-foreground">
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
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full glow-primary"></div>
                <span className="text-sm text-primary font-medium">Mainnet Live</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full glow-primary"></div>
                <span className="text-sm text-primary font-medium">Realtime Data</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              Last updated: {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;