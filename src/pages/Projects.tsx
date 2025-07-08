import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/layout/Layout";
import ProjectCard from "@/components/ui/ProjectCard";

// Mock data for projects
const mockProjects = [
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
  },
  {
    projectId: "4",
    projectName: "NFT Marketplace",
    tokenSymbol: "NFTMP",
    targetAmount: "1000000",
    totalRaised: "1000000",
    totalInvestors: "892",
    startTime: "2024-01-01",
    endTime: "2024-01-08",
    status: 'ENDED' as const,
    isOverSubscribed: false,
    progress: 100
  },
  {
    projectId: "5",
    projectName: "Cross-Chain Bridge",
    tokenSymbol: "BRIDGE",
    targetAmount: "600000",
    totalRaised: "234000",
    totalInvestors: "156",
    startTime: "2024-01-12",
    endTime: "2024-01-19",
    status: 'ACTIVE' as const,
    isOverSubscribed: false,
    progress: 39
  },
  {
    projectId: "6",
    projectName: "Yield Optimizer",
    tokenSymbol: "YIELD",
    targetAmount: "800000",
    totalRaised: "0",
    totalInvestors: "0",
    startTime: "2024-02-01",
    endTime: "2024-02-08",
    status: 'PENDING' as const,
    isOverSubscribed: false,
    progress: 0
  }
];

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  const filteredProjects = mockProjects.filter(project => {
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