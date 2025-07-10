import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProjectCardProps {
  project: {
    projectId: string;
    projectName: string;
    tokenSymbol: string;
    description?: string; // Add description field
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
  onInvest?: (projectId: string, amount: string) => void;
}

const ProjectCard = ({ project, className = '', style, onInvest }: ProjectCardProps) => {
  const [investAmount, setInvestAmount] = useState("");
  const [isInvestDialogOpen, setIsInvestDialogOpen] = useState(false);

  const handleInvest = () => {
    if (onInvest && investAmount) {
      onInvest(project.projectId, investAmount);
      setInvestAmount("");
      setIsInvestDialogOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'border-green-500 bg-green-500/10 text-green-500';
      case 'PENDING':
        return 'border-yellow-500 bg-yellow-500/10 text-yellow-500';
      case 'ENDED':
        return 'border-gray-500 bg-gray-500/10 text-gray-500';
      default:
        return 'border-primary bg-primary/10 text-primary';
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
    <div className={`card-pixel group cursor-pointer relative ${className}`} style={style}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 mr-4">
          <h3 className="font-mono font-bold text-lg text-gradient-primary">
            {project.tokenSymbol}
          </h3>
          <p className="font-mono text-sm text-muted-foreground">
            {project.projectName}
          </p>
          {project.description && (
            <p className="font-mono text-xs text-muted-foreground mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        <div className={`px-2 py-1 rounded border font-mono text-xs font-bold uppercase tracking-wider ${getStatusColor(project.status)}`}>
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
        <div className="progress-pixel" style={{ '--progress': `${Math.min(project.progress, 100)}%` } as React.CSSProperties}>
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
          {project.isOverSubscribed ? (
            <p className="font-mono text-xs font-semibold text-warning uppercase">
              Oversubscribed
            </p>
          ) : (
            <p className={`font-mono text-xs font-semibold uppercase ${
              project.status === 'ACTIVE' ? 'text-green-500' :
              project.status === 'PENDING' ? 'text-yellow-500' :
              'text-gray-500'
            }`}>
              {project.status}
            </p>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 border-t border-border">
        {project.status === 'ACTIVE' && onInvest && (
          <Dialog open={isInvestDialogOpen} onOpenChange={setIsInvestDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full btn-pixel">
                INVEST NOW
              </Button>
            </DialogTrigger>
            <DialogContent className="card-pixel">
              <DialogHeader>
                <DialogTitle className="font-mono text-gradient-primary">
                  Invest in {project.tokenSymbol}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="font-mono text-sm">
                    Investment Amount (USDT)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount..."
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    className="input-pixel"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleInvest}
                    disabled={!investAmount || parseFloat(investAmount) <= 0}
                    className="btn-pixel flex-1"
                  >
                    CONFIRM INVESTMENT
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsInvestDialogOpen(false)}
                    className="btn-pixel-secondary flex-1"
                  >
                    CANCEL
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        {project.status === 'PENDING' && (
          <Button 
            className="w-full btn-pixel"
            disabled
          >
            STARTS SOON
          </Button>
        )}
        
        {project.status === 'ENDED' && (
          <Button 
            className="w-full btn-pixel"
            disabled
          >
            ENDED
          </Button>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

export default ProjectCard;