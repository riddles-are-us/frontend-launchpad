import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProjectCardProps {
  project: {
    projectId: string;
    projectName: string;
    tokenSymbol: string;
    description?: string;
    targetAmount: string;
    totalRaised: string;
    totalInvestors: string;
    startTime: string;
    endTime: string;
    status: 'PENDING' | 'ACTIVE' | 'ENDED';
    isOverSubscribed: boolean;
    progress: number;
    maxIndividualCap: string;
    tokenPrice: string;
    tokenSupply: string;
  };
  globalCounter?: number; // Current global counter from RPC
  className?: string;
  style?: React.CSSProperties;
  onInvest?: (projectId: string, amount: string) => void;
}

const ProjectCard = ({ project, globalCounter, className = '', style, onInvest }: ProjectCardProps) => {
  const [investAmount, setInvestAmount] = useState("");
  const [isInvestDialogOpen, setIsInvestDialogOpen] = useState(false);
  const [, forceUpdate] = useState({});

  // Force update every 5 seconds to sync with global counter updates
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    // Return the full amount with comma separators for readability
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatTokenSupply = (supply: string) => {
    const num = parseFloat(supply);
    if (num >= 1e12) {
      return `${(num / 1e12).toFixed(1)}T`; // Trillion
    } else if (num >= 1e9) {
      return `${(num / 1e9).toFixed(1)}B`; // Billion
    } else if (num >= 1e6) {
      return `${(num / 1e6).toFixed(1)}M`; // Million
    } else if (num >= 1e3) {
      return `${(num / 1e3).toFixed(1)}K`; // Thousand
    }
    return num.toString();
  };

  const calculateAndFormatTokenPrice = (targetAmount: string, tokenSupply: string) => {
    const target = parseFloat(targetAmount);
    const supply = parseFloat(tokenSupply);
    
    // Avoid division by zero
    if (supply === 0 || isNaN(target) || isNaN(supply)) {
      return "N/A";
    }
    
    const price = target / supply;
    
    // For very small numbers, use scientific notation
    if (price < 0.0001) {
      return price.toExponential(2); // e.g., 1.23e-5
    } else if (price < 0.01) {
      return price.toFixed(6); // e.g., 0.000123
    } else if (price < 1) {
      return price.toFixed(4); // e.g., 0.1234
    } else {
      return price.toFixed(3); // e.g., 1.234
    }
  };

  const calculateAccurateProgress = (totalRaised: string, targetAmount: string) => {
    const raised = parseFloat(totalRaised);
    const target = parseFloat(targetAmount);
    
    if (target === 0 || isNaN(raised) || isNaN(target)) {
      return 0;
    }
    
    return Math.min((raised / target) * 100, 100);
  };

  const formatTimeRemaining = (status: string, startTime: string, endTime: string) => {
    // startTime and endTime are already counter values from the backend
    const startCounter = parseInt(startTime);
    const endCounter = parseInt(endTime);
    
    // Use the real global counter if available, otherwise fallback to estimation
    let currentCounter = globalCounter;
    if (!currentCounter || currentCounter === 0) {
      // Fallback to estimation if no global counter available
      const now = Math.floor(Date.now() / 1000);
      currentCounter = Math.floor(now / 5);
    }
    
    if (status === 'PENDING') {
      const remainingCounters = startCounter - currentCounter;
      if (remainingCounters <= 0) return "Starting soon";
      return `Starts in ${formatCounterTime(remainingCounters)}`;
    } else if (status === 'ACTIVE') {
      const remainingCounters = endCounter - currentCounter;
      if (remainingCounters <= 0) return "Ending soon";
      return `Ends in ${formatCounterTime(remainingCounters)}`;
    } else {
      return "Ended";
    }
  };

  const formatCounterTime = (counters: number) => {
    const totalSeconds = counters * 5;
    
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
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
            {calculateAccurateProgress(project.totalRaised, project.targetAmount).toFixed(2)}%
          </span>
        </div>
        <div className="progress-pixel" style={{ '--progress': `${calculateAccurateProgress(project.totalRaised, project.targetAmount)}%` } as React.CSSProperties}>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3 mb-4">
        {/* First row: Target & Raised */}
        <div className="grid grid-cols-2 gap-4">
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
        </div>
        
        {/* Second row: Token Supply & Token Price */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="font-mono text-xs text-muted-foreground uppercase">Token Supply</p>
            <p className="font-mono text-sm font-semibold text-primary">
              {formatTokenSupply(project.tokenSupply)} {project.tokenSymbol}
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-xs text-muted-foreground uppercase">Token Price</p>
            <p className="font-mono text-sm font-semibold text-secondary">
              {calculateAndFormatTokenPrice(project.targetAmount, project.tokenSupply)} USDT
            </p>
          </div>
        </div>
        
        {/* Third row: Max Cap & Investors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="font-mono text-xs text-muted-foreground uppercase">Max Individual Cap</p>
            <p className="font-mono text-sm font-semibold text-warning">
              {formatAmount(project.maxIndividualCap)} USDT
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-xs text-muted-foreground uppercase">Investors</p>
            <p className="font-mono text-sm font-semibold text-secondary">
              {project.totalInvestors}
            </p>
          </div>
        </div>
        
        {/* Status row */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground uppercase">Status</p>
            <div className="text-right">
              {project.isOverSubscribed ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
                  <p className="font-mono text-xs font-semibold text-warning uppercase">
                    Oversubscribed
                  </p>
                </div>
              ) : (
                <div>
                  <p className={`font-mono text-xs font-semibold uppercase ${
                    project.status === 'ACTIVE' ? 'text-green-500' :
                    project.status === 'PENDING' ? 'text-yellow-500' :
                    'text-gray-500'
                  }`}>
                    {project.status}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    {formatTimeRemaining(project.status, project.startTime, project.endTime)}
                  </p>
                </div>
              )}
            </div>
          </div>
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