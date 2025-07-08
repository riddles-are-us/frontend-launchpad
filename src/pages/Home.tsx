import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/ui/StatCard";
import ProjectCard from "@/components/ui/ProjectCard";

// Mock data for demonstration
const mockStats = {
  totalProjects: "24",
  totalRaised: "15.2M",
  activeInvestors: "3,847",
  avgRoi: "+245%"
};

const mockFeaturedProjects = [
  {
    projectId: "1",
    projectName: "DeFi Protocol X",
    tokenSymbol: "DPX",
    targetAmount: "500000",
    totalRaised: "425000",
    totalInvestors: "324",
    startTime: "2024-01-15",
    endTime: "2024-01-22",
    status: 'ACTIVE' as const,
    isOverSubscribed: false,
    progress: 85
  },
  {
    projectId: "2", 
    projectName: "Gaming Metaverse",
    tokenSymbol: "GMETA",
    targetAmount: "750000",
    totalRaised: "892000", 
    totalInvestors: "567",
    startTime: "2024-01-10",
    endTime: "2024-01-20",
    status: 'ACTIVE' as const,
    isOverSubscribed: true,
    progress: 119
  },
  {
    projectId: "3",
    projectName: "AI Trading Bot",
    tokenSymbol: "AIBOT",
    targetAmount: "300000",
    totalRaised: "0",
    totalInvestors: "0", 
    startTime: "2024-01-25",
    endTime: "2024-02-01",
    status: 'PENDING' as const,
    isOverSubscribed: false,
    progress: 0
  }
];

const Home = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
              THE ULTIMATE IDO PLATFORM
            </p>
            <p className="text-lg font-mono text-foreground/80 max-w-2xl mx-auto">
              Invest in cutting-edge zkCross projects with USDT. 
              Dynamic allocation, instant withdrawals, zero fees.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button className="btn-pixel text-lg px-8 py-3">
                EXPLORE PROJECTS
              </Button>
              <Button className="btn-pixel-secondary text-lg px-8 py-3">
                CONNECT WALLET
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
              value={mockStats.totalProjects}
              change="+3 this week"
              changeType="positive"
              className="animate-fadeIn"
            />
            <StatCard
              title="Total Raised"
              value={`$${mockStats.totalRaised}`}
              change="+12.5% this month"
              changeType="positive" 
              className="animate-fadeIn"
            />
            <StatCard
              title="Active Investors"
              value={mockStats.activeInvestors}
              change="+234 this week"
              changeType="positive"
              className="animate-fadeIn"
            />
            <StatCard
              title="Average ROI"
              value={mockStats.avgRoi}
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
            {mockFeaturedProjects.map((project, index) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button className="btn-pixel-accent text-lg px-8 py-3">
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
            {[
              { user: "0x1234...5678", action: "invested 1,250 USDT in", project: "DPX", time: "2m ago" },
              { user: "0x9abc...def0", action: "withdrew tokens from", project: "GMETA", time: "5m ago" },
              { user: "0x2468...ace1", action: "invested 500 USDT in", project: "DPX", time: "7m ago" },
              { user: "0xbeef...cafe", action: "invested 2,000 USDT in", project: "GMETA", time: "12m ago" }
            ].map((activity, index) => (
              <div key={index} className="card-pixel p-4 animate-slideInRight" style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pixel-pulse"></div>
                    <div className="font-mono text-sm">
                      <span className="text-accent">{activity.user}</span>
                      <span className="text-muted-foreground"> {activity.action} </span>
                      <span className="text-primary font-semibold">{activity.project}</span>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              </div>
            ))}
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
                <span className="font-mono text-sm text-success">MAINNET LIVE</span>
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