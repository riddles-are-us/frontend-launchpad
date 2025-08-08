import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProjectDescription } from "../../utils/project-descriptions";

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

  // Input validation function for investment amount
  const handleInvestAmountChange = (value: string) => {
    // Remove any non-numeric characters (only allow digits)
    const cleanValue = value.replace(/[^0-9]/g, '');
    
    // Allow any positive integer input (validation happens at button level)
    setInvestAmount(cleanValue);
  };
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Check if description needs truncation (rough estimation based on character count and typical line length)
  const needsTruncation = project.description && project.description.length > 80;
  
  // Get project social links from descriptions data
  const projectData = getProjectDescription(project.projectId);
  const hasWebsite = projectData?.website && projectData.website !== "";
  const hasTwitter = projectData?.twitter && projectData.twitter !== "";
  const hasTelegram = projectData?.telegram && projectData.telegram !== "";
  const [isInvestDialogOpen, setIsInvestDialogOpen] = useState(false);

  // Note: Component updates automatically when LaunchpadContext refreshes data every 5 seconds
  // Removed duplicate 5-second interval to avoid redundant updates

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
    const totalSupply = parseFloat(tokenSupply);
    
    // Avoid division by zero
    if (totalSupply === 0 || isNaN(target) || isNaN(totalSupply)) {
      return "N/A";
    }
    
    // Use 80% of token supply for price calculation (20% reserved)
    const distributableSupply = totalSupply * 0.8;
    // Convert points to USDT: 100,000 points = 1 USDT
    const targetInUSDT = target / 100000;
    const price = targetInUSDT / distributableSupply;
    
    // For very small numbers (more than 10 zeros), use scientific notation
    if (price < 0.0000000001) { // 10 zeros after decimal point
      return price.toExponential(2); // e.g., 1.23e-11
    } else if (price < 0.000001) {
      return price.toFixed(10); // e.g., 0.0000012345
    } else if (price < 0.001) {
      return price.toFixed(8); // e.g., 0.00012345
    } else if (price < 0.01) {
      return price.toFixed(6); // e.g., 0.001234
    } else if (price < 1) {
      return price.toFixed(4); // e.g., 0.1234
    } else {
      return price.toFixed(3); // e.g., 1.234
    }
  };

  // Calculate expected tokens based on 80% distributable supply
  const calculateExpectedTokens = (investmentAmount: string, targetAmount: string, tokenSupply: string) => {
    const investment = parseFloat(investmentAmount);
    const target = parseFloat(targetAmount);
    const totalSupply = parseFloat(tokenSupply);
    
    if (investment === 0 || target === 0 || totalSupply === 0 || isNaN(investment) || isNaN(target) || isNaN(totalSupply)) {
      return "0";
    }
    
    // Use 80% of token supply for allocation (20% reserved)
    const distributableSupply = totalSupply * 0.8;
    const expectedTokens = (investment * distributableSupply) / target;
    
    return expectedTokens.toLocaleString();
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
          <p className="font-mono text-xs text-muted-foreground/80">
            ID: {project.projectId}
          </p>
          {project.description && (
            <div className="mt-1">
              <p 
                className="font-mono text-xs text-muted-foreground"
                style={!isDescriptionExpanded ? {
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                } : {}}
              >
                {project.description}
              </p>
              {(needsTruncation || hasWebsite || hasTwitter || hasTelegram) && (
                <div className="flex items-center justify-between mt-1">
                  {needsTruncation && (
                    <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDescriptionExpanded(!isDescriptionExpanded);
                    }}
                    className="font-mono text-xs text-primary hover:text-primary/80 transition-colors underline hover:no-underline inline-flex items-center gap-1"
                  >
                    {isDescriptionExpanded ? (
                      <>
                        Show less
                        <svg className="w-3 h-3 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        More
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                      )}
                    </button>
                  )}
                
                {/* Social Links */}
                {(hasWebsite || hasTwitter || hasTelegram) && (
                  <div className="flex items-center gap-2">
                    {hasWebsite && (
                      <a
                        href={projectData?.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="Visit Website"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </a>
                    )}
                    {hasTwitter && (
                      <a
                        href={projectData?.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-blue-400 transition-colors"
                        title="Follow on Twitter"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>
                    )}
                    {hasTelegram && (
                      <a
                        href={projectData?.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-blue-500 transition-colors"
                        title="Join Telegram"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                      </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
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
            <p className="font-mono text-xs text-foreground font-bold uppercase tracking-wider">Target</p>
            <p className="font-mono text-sm text-primary">
              {formatAmount(project.targetAmount)} points
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              (~${(parseFloat(project.targetAmount) / 100000).toFixed(0)} USDT equivalent)
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-xs text-foreground font-bold uppercase tracking-wider">Raised</p>
            <p className="font-mono text-sm text-accent">
              {formatAmount(project.totalRaised)} points
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              (~${(parseFloat(project.totalRaised) / 100000).toFixed(0)} USDT equivalent)
            </p>
          </div>
        </div>
        
        {/* Second row: Token Supply & Token Price */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="font-mono text-xs text-foreground font-bold uppercase tracking-wider">Token Supply</p>
            <p className="font-mono text-sm text-primary">
              {formatTokenSupply(project.tokenSupply)} {project.tokenSymbol}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {formatTokenSupply((parseFloat(project.tokenSupply) * 0.8).toString())} for sale (80%)
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {formatTokenSupply((parseFloat(project.tokenSupply) * 0.2).toString())} for liquidity (20%)
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-xs text-foreground font-bold uppercase tracking-wider">Token Price</p>
            <p className="font-mono text-sm text-secondary">
              {calculateAndFormatTokenPrice(project.targetAmount, project.tokenSupply)} USDT
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              ({(parseFloat(calculateAndFormatTokenPrice(project.targetAmount, project.tokenSupply)) * 100000).toLocaleString()} points per token)
            </p>
          </div>
        </div>
        
        {/* Third row: Max Cap & Investors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="font-mono text-xs text-foreground font-bold uppercase tracking-wider">Max Individual Cap</p>
            <p className="font-mono text-sm text-warning">
              {formatAmount(project.maxIndividualCap)} points
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              (~${(parseFloat(project.maxIndividualCap) / 100000).toFixed(0)} USDT equivalent)
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-xs text-foreground font-bold uppercase tracking-wider">Investors</p>
            <p className="font-mono text-sm text-secondary">
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
                <div>
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
                    <p className="font-mono text-xs font-semibold text-warning uppercase">
                      Oversubscribed
                    </p>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatTimeRemaining(project.status, project.startTime, project.endTime)}
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
                    Investment Amount (Min 100K ZKWASM Points / ~$1 USDT equivalent)
                  </Label>
                  <Input
                    id="amount"
                    type="text"
                    placeholder="Enter amount..."
                    value={investAmount}
                    onChange={(e) => handleInvestAmountChange(e.target.value)}
                    className="input-pixel"
                    min="1"
                    step="1"
                  />
                  <div className="text-xs font-mono text-muted-foreground">
                    💡 Range: 100,000 - {parseInt(project.maxIndividualCap).toLocaleString()} points
                  </div>
                  {investAmount && parseInt(investAmount) > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-mono text-muted-foreground">
                        ~${(parseInt(investAmount) / 100000).toFixed(2)} USDT equivalent
                      </div>
                      <div className="bg-muted/20 p-3 rounded border">
                        <div className="space-y-1">
                          <p className="font-mono text-xs text-muted-foreground">Expected Tokens:</p>
                          <p className="font-mono text-sm font-semibold text-primary">
                            {calculateExpectedTokens(investAmount, project.targetAmount, project.tokenSupply)} {project.tokenSymbol}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleInvest}
                    disabled={!investAmount || parseInt(investAmount || "0") < 100000 || parseInt(investAmount || "0") > parseInt(project.maxIndividualCap)}
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