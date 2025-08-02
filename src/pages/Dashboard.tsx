import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import Layout from "@/components/layout/Layout";
import StatCard from "@/components/ui/StatCard";
import { useUserPortfolio, useInvestment, useLaunchpad } from "@/contexts/LaunchpadContext";
import { useWallet } from "@/contexts/WalletContext";
import { useConnectModal } from "zkwasm-minirollup-browser";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

// Fallback data for when API data is not available
const fallbackUserData = {
  balance: "0.00",
  totalInvested: "0.00",
  totalTokens: "0",
  totalProjects: "0",
  portfolioValue: "0.00",
  unrealizedGains: "No gains/losses"
};

// Extended portfolio project interface
interface PortfolioProject {
  projectId: string;
  tokenSymbol: string;
  projectName: string;
  invested: string;
  tokensOwned: string;
  currentValue: string;
  status: 'PENDING' | 'ACTIVE' | 'ENDED';
  canWithdraw: boolean;
  gainLoss: string;
  gainLossPercent: string;
  isOverSubscribed: boolean;
  refundAmount: string;
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("portfolio");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [hasSeenPointsDialog, setHasSeenPointsDialog] = useState(false);

  // Reset dialog seen status when component mounts (entering dashboard)
  useEffect(() => {
    setHasSeenPointsDialog(false);
  }, []); // Empty dependency array means this runs only on mount
  const itemsPerPage = 10;

  // Note: Time updates are now handled by LaunchpadContext's 5-second polling
  // Removed duplicate 5-second interval to avoid redundant updates
  
  // Use launchpad context hooks
  const { isConnected, userStats, loading, error, withdrawPoints, api, projects, globalCounter } = useLaunchpad();
  const { positions, transactionHistory, refetch } = useUserPortfolio();
  const { withdraw, transaction } = useInvestment();
  
  // Use wallet context
  const { isConnected: walletConnected, l1Account, l2Account, deposit, connectL2 } = useWallet();
  const { openConnectModal } = useConnectModal();

  // Check if user has zero points and show dialog - must be before early returns
  useEffect(() => {
    if (walletConnected && l2Account && !showPointsDialog && !hasSeenPointsDialog) {
      // Check if user has zero points or no balance data
      const balance = userStats && userStats.balance ? parseFloat(userStats.balance) : 0;
      console.log('Points dialog check - balance:', balance, 'userStats:', userStats);
      
      if (balance === 0) {
        console.log('Showing points dialog - zero balance detected');
        setShowPointsDialog(true);
        setHasSeenPointsDialog(true); // Mark as seen when showing
      }
    }
  }, [walletConnected, l2Account, userStats, showPointsDialog, hasSeenPointsDialog]);

  // Handle token withdrawal
  const handleWithdraw = async (projectId: string) => {
    try {
      await withdraw(projectId);
      toast({
        title: "Success",
        description: "Tokens withdrawn successfully!",
      });
      refetch(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to withdraw tokens",
        variant: "destructive",
      });
    }
  };

  // Handle ZKWASM Points withdrawal
  const handlePointsWithdraw = async () => {
    try {
      await withdrawPoints(withdrawAmount);
      const usdtEquivalent = (parseFloat(withdrawAmount) / 100000).toFixed(2);
      toast({
        title: "Success",
        description: `${withdrawAmount} ZKWASM Points (${usdtEquivalent} USDT equivalent) withdrawn successfully to your wallet!`,
      });
      setWithdrawAmount("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to withdraw ZKWASM Points",
        variant: "destructive",
      });
    }
  };

  // Handle ZKWASM Points deposit  
  const handlePointsDeposit = async () => {
    if (!deposit) {
      toast({
        title: "Error",
        description: "Deposit function is not available",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use points amount directly
      const pointsAmount = Number(depositAmount);
      await deposit({
        tokenIndex: 0,
        amount: pointsAmount,
      });
      const usdtEquivalent = (pointsAmount / 100000).toFixed(2);
      toast({
        title: "Success", 
        description: `${pointsAmount} ZKWASM Points (~$${usdtEquivalent} USDT equivalent) deposited successfully to your launchpad balance!`,
      });
      setDepositAmount("");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to deposit ZKWASM Points",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="bg-background flex items-center justify-center min-h-[60vh] py-8">
          <div className="container mx-auto px-4 max-w-md">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground font-mono">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state
  if (error) {
    return (
      <Layout>
        <div className="bg-background flex items-center justify-center min-h-[60vh] py-8">
          <div className="container mx-auto px-4 max-w-md">
            <div className="text-center space-y-3">
              <p className="text-destructive font-mono mb-3">Error: {error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show connection required state
  if (!walletConnected || !l2Account) {
    return (
      <Layout>
        <div className="bg-background flex items-center justify-center min-h-[60vh] py-8">
          <div className="container mx-auto px-4 max-w-md">
            <div className="text-center space-y-3">
                <div className="mb-2">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-2 overflow-hidden">
                    <img src="/favicon.ico" alt="ZKCross" className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-mono font-bold text-gradient-primary mb-2">
                    Wallet Connection Required
                  </h2>
                  <p className="text-muted-foreground font-mono mb-3">
                    {!walletConnected 
                      ? "Please connect your wallet to access the dashboard" 
                      : "Please connect to L2 to access the dashboard"}
                  </p>
                </div>
                
              <div className="space-y-3">
                <p className="text-sm font-mono text-muted-foreground">
                  Connect your wallet to access the dashboard
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  {!walletConnected ? (
                    <Button 
                      onClick={() => openConnectModal?.()}
                      className="btn-pixel"
                    >
                      CONNECT WALLET
                    </Button>
                  ) : (
                    <Button 
                      onClick={async () => {
                        try {
                          await connectL2();
                          toast({
                            title: "Success",
                            description: "Connected to L2 successfully!",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to connect to L2",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="btn-pixel"
                    >
                      CONNECT LAUNCHPAD
                    </Button>
                  )}
                  <Link to="/">
                    <Button variant="outline" className="btn-pixel-secondary">
                      GO TO HOME
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Use real data from API or fallback to empty data
  const dashboardStats = userStats || fallbackUserData;
  console.log('Dashboard: userStats:', userStats);
  console.log('Dashboard: dashboardStats:', dashboardStats);
  console.log('Dashboard: balance value:', dashboardStats.balance);
  
  const portfolioProjects: PortfolioProject[] = positions.map(position => {
    // Find the corresponding project data to get current info
    const projectData = projects.find(p => p.projectId === position.projectId);
    
    if (!projectData || !api) {
      return {
        projectId: position.projectId,
        tokenSymbol: position.tokenSymbol,
        projectName: position.projectName || position.tokenSymbol,
        invested: position.investedAmount,
        tokensOwned: "0",
        currentValue: "0",
        status: position.status,
        canWithdraw: position.canWithdraw,
        gainLoss: "+0.00",
        gainLossPercent: "+0%",
        isOverSubscribed: false,
        refundAmount: "0"
      };
    }

    // Calculate correct project status using globalCounter
    let projectStatus: 'PENDING' | 'ACTIVE' | 'ENDED' = 'ENDED';
    if (globalCounter) {
      const startTime = parseInt(projectData.startTime);
      const endTime = parseInt(projectData.endTime);
      
      if (globalCounter < startTime) {
        projectStatus = 'PENDING';
      } else if (globalCounter < endTime) {
        projectStatus = 'ACTIVE';
      } else {
        projectStatus = 'ENDED';
      }
    }

    // Calculate token allocation and refund
    const userInvestment = BigInt(position.investedAmount);
    const totalRaised = BigInt(projectData.totalRaised);
    const tokenSupply = BigInt(projectData.tokenSupply);
    const targetAmount = BigInt(projectData.targetAmount);
    const isOverSubscribed = projectData.isOverSubscribed;

    const allocation = api.calculateTokenAllocation(
      userInvestment,
      totalRaised,
      tokenSupply,
      targetAmount,
      isOverSubscribed
    );

    // Format token amounts
    const tokensOwned = Number(allocation.allocatedTokens).toLocaleString();
    const refundAmount = Number(allocation.refundAmount).toString();

    // Calculate current value (for ended projects, use token price; for active, use invested amount)
    let currentValue = "0";
    if (projectStatus === 'ENDED') {
      // Use token price for ended projects
      const tokenPrice = parseFloat(projectData.tokenPrice);
      currentValue = (Number(allocation.allocatedTokens) * tokenPrice).toFixed(2);
    } else {
      // For active projects, current value equals invested amount
      currentValue = position.investedAmount;
    }

    // Calculate P&L
    const investedAmount = parseFloat(position.investedAmount);
    const currentValueNum = parseFloat(currentValue);
    const gainLoss = currentValueNum - investedAmount;
    const gainLossPercent = investedAmount > 0 ? (gainLoss / investedAmount) * 100 : 0;

    return {
      projectId: position.projectId,
      tokenSymbol: position.tokenSymbol,
      projectName: position.projectName || position.tokenSymbol,
      invested: position.investedAmount,
      tokensOwned,
      currentValue,
      status: projectStatus,
      canWithdraw: projectStatus === 'ENDED' && !position.tokensWithdrawn,
      gainLoss: `${gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)}`,
      gainLossPercent: `${gainLossPercent >= 0 ? '+' : ''}${gainLossPercent.toFixed(1)}%`,
      isOverSubscribed,
      refundAmount
    };
  });
  
  // Map transaction history with project names
  const transactionHistoryData = transactionHistory.map(tx => {
    // Map project ID to project name (0 = ZKWASM Points, other IDs map to project names)
    let projectName = 'Unknown Project';
    if (tx.project === '0') {
      projectName = 'ZKWASM Points';
    } else {
      // Find project by ID
      const project = projects.find(p => p.projectId === tx.project);
      if (project) {
        projectName = project.tokenSymbol || project.projectName || `Project ${tx.project}`;
      } else {
        projectName = `Project ${tx.project}`;
      }
    }
    
    return {
      ...tx,
      project: projectName
    };
  });
  
  // Pagination logic for transactions
  const totalTransactions = transactionHistoryData.length;
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactionHistoryData.slice(startIndex, endIndex);

  // Reset to first page when switching to transactions tab
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "transactions") {
      setCurrentPage(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-success';
      case 'PENDING':
        return 'text-warning';
      case 'FAILED':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'INVEST':
        return 'text-primary';
      case 'WITHDRAW':
        return 'text-accent';
      case 'REFUND':
        return 'text-secondary';
      default:
        return 'text-muted-foreground';
    }
  };

  // Format timestamp (counter) to "X ago" format using globalCounter
  const formatTimeAgo = (transactionCounter: string): string => {
    try {
      const txCounter = parseInt(transactionCounter);
      
      if (!globalCounter || globalCounter === 0 || isNaN(txCounter)) {
        // Fallback to estimation if no global counter available
        const now = Math.floor(Date.now() / 1000);
        const estimatedCurrentCounter = Math.floor(now / 5);
        const counterDiff = estimatedCurrentCounter - txCounter;
        const secondsAgo = counterDiff * 5;
        
        if (secondsAgo < 60) return `${secondsAgo}s ago`;
        if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
        if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
        if (secondsAgo < 2592000) return `${Math.floor(secondsAgo / 86400)}d ago`;
        return `${Math.floor(secondsAgo / 2592000)}mo ago`;
      }
      
      // Use real global counter: (current counter - transaction counter) * 5 = seconds ago
      const counterDiff = globalCounter - txCounter;
      const secondsAgo = counterDiff * 5;
      
      if (secondsAgo < 0) return "just now"; // Future transaction (shouldn't happen)
      if (secondsAgo < 60) return `${secondsAgo}s ago`;
      if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
      if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
      if (secondsAgo < 2592000) return `${Math.floor(secondsAgo / 86400)}d ago`;
      return `${Math.floor(secondsAgo / 2592000)}mo ago`;
    } catch (error) {
      return transactionCounter; // Fallback to original counter if parsing fails
    }
  };

  console.log('Dashboard: l1Account:', l1Account, l2Account);

  return (
    <Layout>
      <div className="bg-background py-6">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-mono text-gradient-primary mb-4">
              DASHBOARD
            </h1>
            <p className="text-lg font-mono text-muted-foreground">
              Your IDO investment portfolio
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="ZKWASM Points Balance"
              value={`${parseFloat(dashboardStats.balance).toLocaleString()} points`}
              change={`~$${(parseFloat(dashboardStats.balance) / 100000).toFixed(2)} USDT equivalent`}
              changeType="neutral"
            />
            <StatCard
              title="Total Invested"
              value={`${parseFloat(dashboardStats.totalInvested).toLocaleString()} points`}
              change={`~$${(parseFloat(dashboardStats.totalInvested) / 100000).toFixed(2)} USDT equivalent • ${dashboardStats.totalProjects} projects`}
              changeType="neutral"
            />
            <StatCard
              title="Portfolio Value"
              value={`${parseFloat(dashboardStats.portfolioValue).toLocaleString()} points`}
              change={`~$${(parseFloat(dashboardStats.portfolioValue) / 100000).toFixed(2)} USDT equivalent${dashboardStats.unrealizedGains === "0" || dashboardStats.unrealizedGains === "0.00" || parseFloat(dashboardStats.unrealizedGains || "0") === 0 ? " • No gains/losses" : ` • ${dashboardStats.unrealizedGains}`}`}
              changeType="neutral"
            />
            <StatCard
              title="Total Tokens"
              value={dashboardStats.totalTokens}
              change="Across all projects"
              changeType="neutral"
            />
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-card border-2 border-border">
              <TabsTrigger 
                value="portfolio" 
                className="font-mono font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                PORTFOLIO
              </TabsTrigger>
              <TabsTrigger 
                value="transactions"
                className="font-mono font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                TRANSACTIONS
              </TabsTrigger>
              <TabsTrigger 
                value="withdrawals"
                className="font-mono font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                WALLET
              </TabsTrigger>
            </TabsList>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {portfolioProjects.map((project, index) => (
                  <Card key={project.projectId} className="card-pixel animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-mono text-lg text-gradient-primary">
                            {project.tokenSymbol}
                          </CardTitle>
                          <p className="font-mono text-sm text-muted-foreground">
                            {project.projectName}
                          </p>
                        </div>
                        <div className={`px-2 py-1 border font-mono text-xs font-semibold uppercase tracking-wider ${
                          project.status === 'ACTIVE' 
                            ? 'border-success bg-success/10 text-success' 
                            : 'border-muted bg-muted/10 text-muted-foreground'
                        }`}>
                          {project.status}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-mono text-xs text-foreground font-bold uppercase tracking-wider">Invested</p>
                          <p className="font-mono text-sm">{parseFloat(project.invested).toLocaleString()} points</p>
                          <p className="font-mono text-xs text-muted-foreground">~${(parseFloat(project.invested) / 100000).toFixed(2)} USDT equivalent</p>
                        </div>
                        <div>
                          <p className="font-mono text-xs text-foreground font-bold uppercase tracking-wider">Tokens</p>
                          <p className="font-mono text-sm text-accent break-all">{project.tokensOwned}</p>
                        </div>
                        <div>
                          <p className="font-mono text-xs text-foreground font-bold uppercase tracking-wider">Value</p>
                          <p className="font-mono text-sm">{parseFloat(project.currentValue).toLocaleString()} points</p>
                          <p className="font-mono text-xs text-muted-foreground">~${(parseFloat(project.currentValue) / 100000).toFixed(2)} USDT equivalent</p>
                        </div>
                        <div>
                          <p className="font-mono text-xs text-foreground font-bold uppercase tracking-wider">P&L</p>
                          <p className={`font-mono text-sm ${
                            project.gainLoss.startsWith('+') ? 'text-success' : 'text-destructive'
                          }`}>
                            {project.gainLoss} ({project.gainLossPercent})
                          </p>
                        </div>
                      </div>
                      
                      {/* Oversubscribed notice */}
                      {project.isOverSubscribed && parseFloat(project.refundAmount) > 0 && (
                        <div className="bg-warning/10 border border-warning p-3 rounded">
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-warning mt-1 animate-pulse"></div>
                            <div className="flex-1">
                              <p className="font-mono text-xs font-semibold text-warning uppercase mb-1">
                                Oversubscribed Project
                              </p>
                              <p className="font-mono text-xs text-warning/80">
                                Refund: {project.refundAmount} ZKWASM Points (~${(parseFloat(project.refundAmount) / 100000).toFixed(2)} USDT equivalent) will be returned to your launchpad balance when withdrawing tokens.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        className={`w-full ${project.canWithdraw ? 'btn-pixel' : 'btn-pixel opacity-50'}`}
                        disabled={!project.canWithdraw}
                        onClick={() => handleWithdraw(project.projectId)}
                      >
                        {project.status === 'ENDED' && project.canWithdraw ? 'WITHDRAW TOKENS' : 
                         project.status === 'ENDED' && !project.canWithdraw ? 'TOKENS WITHDRAWN' :
                         project.status === 'ACTIVE' ? 'PROJECT ACTIVE' : 'PROJECT PENDING'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {portfolioProjects.length === 0 && (
                  <div className="col-span-full">
                    <Card className="card-pixel">
                      <CardContent className="text-center py-12">
                        <p className="font-mono text-muted-foreground mb-4">
                          No portfolio positions found
                        </p>
                        <Link to="/projects">
                          <Button className="btn-pixel">
                            EXPLORE PROJECTS
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-6">
              <Card className="card-pixel">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-mono text-xl text-gradient-secondary">
                      TRANSACTION HISTORY
                    </CardTitle>
                    {transactionHistoryData.length > 0 && (
                      <div className="font-mono text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(endIndex, totalTransactions)} of {totalTransactions}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paginatedTransactions.map((tx, index) => (
                      <div key={tx.id} className="border border-border p-4 bg-card/50 animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`px-2 py-1 border font-mono text-xs font-semibold uppercase ${getTransactionTypeColor(tx.type)}`}>
                              {tx.type}
                            </div>
                            <span className="font-mono text-sm font-semibold text-primary">
                              {tx.project}
                            </span>
                          </div>
                          <div className={`font-mono text-xs font-semibold uppercase ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-mono text-muted-foreground">Amount: </span>
                            <div className="flex flex-col">
                              <span className="font-mono font-semibold">
                                {tx.amount.includes('points') || tx.amount.includes('USDT') || tx.amount.includes('$') 
                                  ? tx.amount 
                                  : `${parseFloat(tx.amount).toLocaleString()} points`}
                              </span>
                              {!tx.amount.includes('points') && !tx.amount.includes('USDT') && !tx.amount.includes('$') && (
                                <span className="font-mono text-xs text-muted-foreground">
                                  ~${(parseFloat(tx.amount) / 100000).toFixed(2)} USDT equivalent
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="font-mono text-muted-foreground">Time: </span>
                            <span className="font-mono">{formatTimeAgo(tx.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {transactionHistoryData.length === 0 && (
                      <div className="text-center py-8">
                        <p className="font-mono text-muted-foreground">
                          No transaction history found
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer font-mono"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                                                 </PaginationContent>
                       </Pagination>
                     </div>
                   )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wallet Tab */}
            <TabsContent value="withdrawals" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ZKWASM Points Deposit */}
                <Card className="card-pixel">
                  <CardHeader>
                    <CardTitle className="font-mono text-lg text-gradient-primary">
                      ZKWASM POINTS DEPOSIT
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="font-mono text-sm text-muted-foreground uppercase">
                        Current Balance
                      </label>
                      <div className="text-2xl font-bold font-mono text-accent">
                        {dashboardStats.balance} points
                      </div>
                      <div className="text-sm font-mono text-muted-foreground">
                        (~${(parseFloat(dashboardStats.balance) / 100000).toFixed(2)} USDT equivalent)
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-sm text-muted-foreground uppercase">
                        Deposit Contract
                      </label>
                      <div className="bg-muted p-3 rounded border">
                        <p className="font-mono text-sm text-foreground break-all">
                          {process.env.REACT_APP_DEPOSIT_CONTRACT?.replace(/"/g, '') || "Contract address not configured"}
                        </p>
                        {process.env.REACT_APP_DEPOSIT_CONTRACT && (
                          <a 
                            href={`https://bscscan.com/address/${process.env.REACT_APP_DEPOSIT_CONTRACT?.replace(/"/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:text-primary/80 transition-colors mt-1"
                          >
                            View in BSC Scan
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                          Deposit ZKWASM Points directly to your launchpad balance
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-sm text-muted-foreground uppercase">
                        Amount (ZKWASM Points)
                      </label>
                      <input 
                        className="w-full input-pixel" 
                        placeholder="100000" 
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                      />
                      <div className="text-xs font-mono text-muted-foreground">
                        ~${(parseFloat(depositAmount || "0") / 100000).toFixed(2)} USDT equivalent
                      </div>
                    </div>
                    <Button 
                      className="w-full btn-pixel"
                      onClick={handlePointsDeposit}
                      disabled={!depositAmount || loading}
                    >
                      {loading ? 'DEPOSITING...' : 'DEPOSIT ZKWASM POINTS'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Available Withdrawals */}
                <Card className="card-pixel">
                  <CardHeader>
                    <CardTitle className="font-mono text-lg text-gradient-primary">
                      AVAILABLE IDO TOKEN WITHDRAWALS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {portfolioProjects
                      .filter(project => project.canWithdraw)
                      .map((project) => (
                        <div key={project.projectId} className="border border-border p-4 bg-card/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono font-semibold text-primary">
                              {project.tokenSymbol}
                            </span>
                            <span className="font-mono text-sm text-accent">
                              {project.tokensOwned} tokens
                            </span>
                          </div>
                          <Button 
                            className="w-full btn-pixel text-sm"
                            onClick={() => handleWithdraw(project.projectId)}
                          >
                            WITHDRAW {project.tokenSymbol}
                          </Button>
                        </div>
                      ))}
                    {portfolioProjects.filter(project => project.canWithdraw).length === 0 && (
                      <div className="text-center py-8">
                        <p className="font-mono text-muted-foreground">
                          No tokens available for withdrawal
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ZKWASM Points Withdrawal */}
                <Card className="card-pixel">
                  <CardHeader>
                    <CardTitle className="font-mono text-lg text-gradient-secondary">
                      ZKWASM POINTS WITHDRAWAL
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="font-mono text-sm text-muted-foreground uppercase">
                        Available Balance
                      </label>
                      <div className="text-2xl font-bold font-mono text-accent">
                        {dashboardStats.balance} points
                      </div>
                      <div className="text-sm font-mono text-muted-foreground">
                        (~${(parseFloat(dashboardStats.balance) / 100000).toFixed(2)} USDT equivalent)
                      </div>
                    </div>
                                        <div className="space-y-2">
                      <label className="font-mono text-sm text-muted-foreground uppercase">
                        Withdrawal Address
                      </label>
                      <div className="bg-muted p-3 rounded border">
                        <p className="font-mono text-sm text-foreground break-all">
                          {l1Account?.address || 'Connect wallet to see address'}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground mt-1">
                          ZKWASM Points will be withdrawn to your connected wallet
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-sm text-muted-foreground uppercase">
                        Amount (ZKWASM Points)
                      </label>
                      <input 
                        className="w-full input-pixel" 
                        placeholder="0" 
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                      <div className="text-xs font-mono text-muted-foreground">
                        ~${(parseFloat(withdrawAmount || "0") / 100000).toFixed(2)} USDT equivalent
                      </div>
                    </div>
                    <Button 
                      className="w-full btn-pixel-secondary"
                      onClick={handlePointsWithdraw}
                      disabled={!withdrawAmount || loading}
                    >
                      {loading ? 'WITHDRAWING...' : 'WITHDRAW ZKWASM POINTS'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Zero Points Dialog */}
      <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
        <DialogContent className="card-pixel max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-gradient-primary text-center">
              🪙 No ZKWASM Points Found
            </DialogTitle>
            <DialogDescription className="font-mono text-center space-y-3">
              <p className="text-muted-foreground">
                You need ZKWASM Points to participate in IDO projects.
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <h4 className="font-mono font-semibold text-primary">Option 1: Already have Points?</h4>
              <p className="font-mono text-xs text-muted-foreground">
                If you already have ZKWASM Points in your wallet, deposit them to your Launchpad balance.
              </p>
              <Button 
                onClick={() => {
                  setActiveTab("withdrawals");
                  setShowPointsDialog(false);
                }}
                className="w-full btn-pixel"
              >
                💳 DEPOSIT FROM WALLET
              </Button>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <h4 className="font-mono font-semibold text-accent">Option 2: Get Points First</h4>
              <p className="font-mono text-xs text-muted-foreground">
                Stake your tokens to earn ZKWASM Points, then withdraw to your wallet and deposit to Launchpad.
              </p>
              <a 
                href="https://staking.zkwasm.ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setShowPointsDialog(false)}
                className="block mt-4"
              >
                <Button className="w-full btn-pixel-accent">
                  🚀 GO TO STAKING
                </Button>
              </a>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setShowPointsDialog(false)}
              className="w-full btn-pixel-secondary"
            >
              I'll do this later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Dashboard;