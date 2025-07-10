import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/layout/Layout";
import ProjectCard from "@/components/ui/ProjectCard";
import { useProjects, useInvestment, useLaunchpad } from "@/contexts/LaunchpadContext";
import { getPublicProjects, type IdoProjectData } from "@/services/api";
import { toast } from "@/hooks/use-toast";

// Projects page now uses real data from LaunchpadContext

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [publicProjects, setPublicProjects] = useState<IdoProjectData[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState<string | null>(null);

  // Use launchpad context hooks
  const { isConnected, loading, error, refreshData } = useLaunchpad();
  const { projects } = useProjects();
  const { invest, transaction } = useInvestment();

  // Load public projects when not connected
  useEffect(() => {
    if (!isConnected) {
      const loadPublicProjects = async () => {
        setPublicLoading(true);
        setPublicError(null);
        try {
          console.log('Loading public projects...');
          const publicProjectsData = await getPublicProjects();
          console.log('Public projects loaded:', publicProjectsData);
          setPublicProjects(publicProjectsData);
        } catch (err) {
          console.error('Failed to load public projects:', err);
          setPublicError(err instanceof Error ? err.message : 'Failed to load projects');
        } finally {
          setPublicLoading(false);
        }
      };
      
      loadPublicProjects();
    }
  }, [isConnected]);

  // Debug: log projects data
  console.log('Projects page - Raw projects data:', projects);
  console.log('Projects page - Public projects data:', publicProjects);
  console.log('Projects page - isConnected:', isConnected);
  console.log('Projects page - loading:', loading);
  console.log('Projects page - error:', error);

  // Handle investment
  const handleInvest = async (projectId: string, amount: string) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to invest in projects",
        variant: "destructive",
      });
      return;
    }

    try {
      await invest(projectId, amount);
      toast({
        title: "Success",
        description: "Investment successful!",
      });
      await refreshData(); // Refresh projects data
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to invest in project",
        variant: "destructive",
      });
    }
  };

  // Use connected user projects or public projects
  const allProjects = isConnected && projects.length > 0 
    ? projects.map(project => ({
        projectId: project.projectId,
        projectName: project.projectName || `${project.tokenSymbol} Project`,
        tokenSymbol: project.tokenSymbol,
        description: project.description || "Example project description",
        targetAmount: project.targetAmount,
        totalRaised: project.totalRaised,
        totalInvestors: project.totalInvestors,
        startTime: new Date(Number(project.startTime) * 1000).toISOString().split('T')[0],
        endTime: new Date(Number(project.endTime) * 1000).toISOString().split('T')[0],
        status: project.status,
        isOverSubscribed: project.isOverSubscribed,
        progress: project.progress
      }))
    : publicProjects.map(project => ({
        projectId: project.projectId,
        projectName: project.projectName || `${project.tokenSymbol} Project`,
        tokenSymbol: project.tokenSymbol,
        description: project.description || "Example project description",
        targetAmount: project.targetAmount,
        totalRaised: project.totalRaised,
        totalInvestors: project.totalInvestors,
        startTime: new Date(Number(project.startTime) * 1000).toISOString().split('T')[0],
        endTime: new Date(Number(project.endTime) * 1000).toISOString().split('T')[0],
        status: project.status,
        isOverSubscribed: project.isOverSubscribed,
        progress: project.progress
      }));

  const filteredProjects = allProjects.filter(project => {
    const matchesSearch = project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "PROGRESS":
        return b.progress - a.progress;
      case "RAISED":
        return parseFloat(b.totalRaised) - parseFloat(a.totalRaised);
      case "INVESTORS":
        return parseInt(b.totalInvestors) - parseInt(a.totalInvestors);
      default:
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    }
  });

  // Show loading state
  if ((isConnected && loading) || (!isConnected && publicLoading)) {
    return (
      <Layout>
        <div className="min-h-screen bg-background py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground font-mono">Loading projects...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state
  if ((isConnected && error) || (!isConnected && publicError)) {
    return (
      <Layout>
        <div className="min-h-screen bg-background py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-destructive font-mono mb-4">Error: {error || publicError}</p>
                <Button onClick={() => refreshData()}>Retry</Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-mono text-gradient-primary mb-4">
              IDO PROJECTS
            </h1>
            <p className="text-lg font-mono text-muted-foreground">
              Discover and invest in cutting-edge zkCross projects
            </p>
          </div>

          {/* Filters */}
          <div className="card-pixel mb-8 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="font-mono text-sm text-muted-foreground uppercase tracking-wider">
                  Search
                </label>
                <Input
                  placeholder="Project name or symbol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-pixel"
                />
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="font-mono text-sm text-muted-foreground uppercase tracking-wider">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="input-pixel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ENDED">Ended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="font-mono text-sm text-muted-foreground uppercase tracking-wider">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="input-pixel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEWEST">Newest</SelectItem>
                    <SelectItem value="PROGRESS">Progress</SelectItem>
                    <SelectItem value="RAISED">Amount Raised</SelectItem>
                    <SelectItem value="INVESTORS">Investors</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Filter Buttons */}
              <div className="space-y-2">
                <label className="font-mono text-sm text-muted-foreground uppercase tracking-wider">
                  Quick Filters
                </label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="btn-pixel text-xs"
                    onClick={() => setStatusFilter("ACTIVE")}
                  >
                    LIVE
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="btn-pixel-secondary text-xs"
                    onClick={() => setStatusFilter("PENDING")}
                  >
                    UPCOMING
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="card-pixel p-4 text-center">
              <div className="text-2xl font-bold font-mono text-primary">
                {sortedProjects.length}
              </div>
              <div className="font-mono text-sm text-muted-foreground uppercase">
                Projects Found
              </div>
            </div>
            <div className="card-pixel p-4 text-center">
              <div className="text-2xl font-bold font-mono text-success">
                {sortedProjects.filter(p => p.status === 'ACTIVE').length}
              </div>
              <div className="font-mono text-sm text-muted-foreground uppercase">
                Active IDOs
              </div>
            </div>
            <div className="card-pixel p-4 text-center">
              <div className="text-2xl font-bold font-mono text-warning">
                {sortedProjects.filter(p => p.status === 'PENDING').length}
              </div>
              <div className="font-mono text-sm text-muted-foreground uppercase">
                Upcoming
              </div>
            </div>
            <div className="card-pixel p-4 text-center">
              <div className="text-2xl font-bold font-mono text-accent">
                {sortedProjects.filter(p => p.isOverSubscribed).length}
              </div>
              <div className="font-mono text-sm text-muted-foreground uppercase">
                Oversubscribed
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {sortedProjects.map((project, index) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 0.05}s` }}
                onInvest={handleInvest}
              />
            ))}
          </div>

          {/* Empty State */}
          {sortedProjects.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-mono font-semibold text-muted-foreground mb-2">
                No projects found
              </h3>
              <p className="font-mono text-muted-foreground mb-6">
                Try adjusting your filters or search terms
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                  setSortBy("NEWEST");
                }}
                className="btn-pixel"
              >
                CLEAR FILTERS
              </Button>
            </div>
          )}

          {/* Load More */}
          {sortedProjects.length > 0 && (
            <div className="text-center">
              <Button className="btn-pixel-accent px-8 py-3">
                LOAD MORE PROJECTS
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Projects;