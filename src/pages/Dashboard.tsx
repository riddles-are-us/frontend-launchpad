import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import StatCard from "@/components/ui/StatCard";
import { useUserPortfolio, useInvestment, useLaunchpad } from "@/contexts/LaunchpadContext";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

// Fallback data for when API data is not available
const fallbackUserData = {
  balance: "0.00",
  totalInvested: "0.00",
  totalTokens: "0",
  totalProjects: "0",
  portfolioValue: "0.00",
  unrealizedGains: "0.00"
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("portfolio");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  
  // Use launchpad context hooks
  const { isConnected, userStats, loading, error, withdrawUsdt } = useLaunchpad();
  const { positions, transactionHistory, refetch } = useUserPortfolio();
  const { withdraw, transaction } = useInvestment();
  
  // Use wallet context
  const { isConnected: walletConnected, l1Account, l2Account } = useWallet();

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

  // Handle USDT withdrawal
  const handleUsdtWithdraw = async () => {
    try {
      await withdrawUsdt(withdrawAmount, withdrawAddress);
      toast({
        title: "Success",
        description: "USDT withdrawn successfully!",
      });
      setWithdrawAmount("");
      setWithdrawAddress("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to withdraw USDT",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground font-mono">Loading dashboard...</p>
              </div>
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
        <div className="min-h-screen bg-background py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-destructive font-mono mb-4">Error: {error}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
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
        <div className="min-h-screen bg-background py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    {/* <Wallet className="h-8 w-8 text-muted-foreground" /> */}
                  </div>
                  <h2 className="text-2xl font-mono font-bold text-gradient-primary mb-2">
                    Wallet Connection Required
                  </h2>
                  <p className="text-muted-foreground font-mono mb-6">
                    {!walletConnected 
                      ? "Please connect your wallet to access the dashboard" 
                      : "Please connect to L2 to access the dashboard"}
                  </p>
                </div>
                
                <div className="flex gap-4 justify-center">
                  <p className="text-sm font-mono text-muted-foreground">
                    Use the wallet button in the header to connect
                  </p>
                  <Link to="/">
                    <Button variant="outline" className="btn-pixel-secondary">
                      Go to Home
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
  
  const portfolioProjects = positions.map(position => ({
    projectId: position.projectId,
    tokenSymbol: position.tokenSymbol,
    projectName: position.projectName || position.tokenSymbol,
    invested: position.investedAmount,
    tokensOwned: "0", // Would need to calculate from position data
    currentValue: position.currentValue || "0",
    status: position.status,
    canWithdraw: position.canWithdraw,
    gainLoss: position.gainLoss || "+0.00",
    gainLossPercent: position.gainLossPercent || "+0%"
  }));
  
  const transactionHistoryData = transactionHistory;

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

  return (
    <Layout>
      <div className="min-h-screen bg-background py-8">
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
              title="USDT Balance"
              value={`$${dashboardStats.balance}`}
              change="Available for investment"
              changeType="neutral"
            />
            <StatCard
              title="Total Invested"
              value={`$${dashboardStats.totalInvested}`}
              change={`${dashboardStats.totalProjects} projects`}
              changeType="positive"
            />
            <StatCard
              title="Portfolio Value"
              value={`$${dashboardStats.portfolioValue}`}
              change={dashboardStats.unrealizedGains}
              changeType="positive"
            />
            <StatCard
              title="Total Tokens"
              value={dashboardStats.totalTokens}
              change="Across all projects"
              changeType="neutral"
            />
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                WITHDRAWALS
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
                          <p className="font-mono text-xs text-muted-foreground uppercase">Invested</p>
                          <p className="font-mono text-sm font-semibold">${project.invested}</p>
                        </div>
                        <div>
                          <p className="font-mono text-xs text-muted-foreground uppercase">Tokens</p>
                          <p className="font-mono text-sm font-semibold text-accent">{project.tokensOwned}</p>
                        </div>
                        <div>
                          <p className="font-mono text-xs text-muted-foreground uppercase">Value</p>
                          <p className="font-mono text-sm font-semibold">${project.currentValue}</p>
                        </div>
                        <div>
                          <p className="font-mono text-xs text-muted-foreground uppercase">P&L</p>
                          <p className="font-mono text-sm font-semibold text-success">
                            {project.gainLoss} ({project.gainLossPercent})
                          </p>
                        </div>
                      </div>
                      <Button 
                        className={`w-full ${project.canWithdraw ? 'btn-pixel' : 'btn-pixel opacity-50'}`}
                        disabled={!project.canWithdraw}
                        onClick={() => handleWithdraw(project.projectId)}
                      >
                        {project.canWithdraw ? 'WITHDRAW TOKENS' : 'TOKENS LOCKED'}
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
                  <CardTitle className="font-mono text-xl text-gradient-secondary">
                    TRANSACTION HISTORY
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactionHistoryData.map((tx, index) => (
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-mono text-muted-foreground">Amount: </span>
                            <span className="font-mono font-semibold">{tx.amount}</span>
                          </div>
                          <div>
                            <span className="font-mono text-muted-foreground">Time: </span>
                            <span className="font-mono">{tx.timestamp}</span>
                          </div>
                          <div>
                            <span className="font-mono text-muted-foreground">TX: </span>
                            <span className="font-mono text-accent cursor-pointer hover:text-accent/80">
                              {tx.txHash}
                            </span>
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Withdrawals Tab */}
            <TabsContent value="withdrawals" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Withdrawals */}
                <Card className="card-pixel">
                  <CardHeader>
                    <CardTitle className="font-mono text-lg text-gradient-primary">
                      AVAILABLE WITHDRAWALS
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

                {/* USDT Withdrawal */}
                <Card className="card-pixel">
                  <CardHeader>
                    <CardTitle className="font-mono text-lg text-gradient-secondary">
                      USDT WITHDRAWAL
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="font-mono text-sm text-muted-foreground uppercase">
                        Available Balance
                      </label>
                      <div className="text-2xl font-bold font-mono text-accent">
                        ${dashboardStats.balance}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-sm text-muted-foreground uppercase">
                        Withdrawal Address
                      </label>
                      <input 
                        className="w-full input-pixel" 
                        placeholder="0x..." 
                        type="text"
                        value={withdrawAddress}
                        onChange={(e) => setWithdrawAddress(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-sm text-muted-foreground uppercase">
                        Amount (USDT)
                      </label>
                      <input 
                        className="w-full input-pixel" 
                        placeholder="0.00" 
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full btn-pixel-secondary"
                      onClick={handleUsdtWithdraw}
                      disabled={!withdrawAmount || !withdrawAddress || loading}
                    >
                      {loading ? 'WITHDRAWING...' : 'WITHDRAW USDT'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;