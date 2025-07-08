import { Button } from "@/components/ui/button";

interface ProjectCardProps {
  project: {
    projectId: string;
    projectName: string;
    tokenSymbol: string;
    targetAmount: string;
    totalRaised: string;
    totalInvestors: string;
    startTime: string;
    endTime: string;
    status: 'PENDING' | 'ACTIVE' | 'ENDED';
    isOverSubscribed: boolean;
    progress: number;
  };
  className?: string;
  style?: React.CSSProperties;
}

const ProjectCard = ({ project, className = '', style }: ProjectCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'border-success bg-success text-success-foreground';
      case 'PENDING':
        return 'border-warning bg-warning text-warning-foreground';
      case 'ENDED':
        return 'border-muted bg-muted text-muted-foreground';
      default:
        return 'border-primary bg-primary text-primary-foreground';
    }
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(0);
  };

  return (
    <div className={`card-pixel group cursor-pointer ${className}`} style={style}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-mono font-bold text-lg text-gradient-primary">
            {project.tokenSymbol}
          </h3>
          <p className="font-mono text-sm text-muted-foreground">
            {project.projectName}
          </p>
        </div>
        <div className={`px-2 py-1 border font-mono text-xs font-semibold uppercase tracking-wider ${getStatusColor(project.status)}`}>
          {project.status}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="font-mono text-sm text-muted-foreground">Progress</span>
          <span className="font-mono text-sm font-semibold text-primary">
            {project.progress.toFixed(1)}%
          </span>
        </div>
        <div className="progress-pixel" style={{ '--progress': `${project.progress}%` } as React.CSSProperties}>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground uppercase">Target</p>
          <p className="font-mono text-sm font-semibold text-foreground">
            {formatAmount(project.targetAmount)} USDT
          </p>
        </div>
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground uppercase">Raised</p>
          <p className="font-mono text-sm font-semibold text-accent">
            {formatAmount(project.totalRaised)} USDT
          </p>
        </div>
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground uppercase">Investors</p>
          <p className="font-mono text-sm font-semibold text-secondary">
            {project.totalInvestors}
          </p>
        </div>
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground uppercase">Status</p>
          {project.isOverSubscribed && (
            <p className="font-mono text-xs font-semibold text-warning uppercase">
              Oversubscribed
            </p>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 border-t border-border">
        <Button 
          className="w-full btn-pixel"
          disabled={project.status === 'ENDED'}
        >
          {project.status === 'ACTIVE' ? 'INVEST NOW' : project.status === 'PENDING' ? 'STARTS SOON' : 'ENDED'}
        </Button>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

export default ProjectCard;