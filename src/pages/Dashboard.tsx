import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/layout/Layout";
import StatCard from "@/components/ui/StatCard";

// Mock user data
const mockUserData = {
  balance: "2,450.75",
  totalInvested: "15,230.00",
  totalTokens: "45,678",
  totalProjects: "8",
  portfolioValue: "18,945.50",
  unrealizedGains: "+3,715.50"
};

const mockPortfolioProjects = [
  {
    projectId: "1",
    tokenSymbol: "DPX",
    projectName: "DeFi Protocol X",
    invested: "2,500.00",
    tokensOwned: "12,500",
    currentValue: "3,125.00",
    status: "ACTIVE",
    canWithdraw: false,
    gainLoss: "+625.00",
    gainLossPercent: "+25%"
  },
  {
    projectId: "2",
    tokenSymbol: "GMETA",
    projectName: "Gaming Metaverse",
    invested: "5,000.00",
    tokensOwned: "8,750",
    currentValue: "6,250.00",
    status: "ACTIVE",
    canWithdraw: false,
    gainLoss: "+1,250.00",
    gainLossPercent: "+25%"
  },
  {
    projectId: "4",
    tokenSymbol: "NFTMP",
    projectName: "NFT Marketplace",
    invested: "3,000.00",
    tokensOwned: "15,000",
    currentValue: "4,500.00",
    status: "ENDED",
    canWithdraw: true,
    gainLoss: "+1,500.00",
    gainLossPercent: "+50%"
  }
];

const mockTransactionHistory = [
  {
    id: "1",
    type: "INVEST",
    project: "DPX",
    amount: "2,500.00",
    timestamp: "2024-01-15 14:30:25",
    status: "COMPLETED",
    txHash: "0x1234...5678"
  },
  {
    id: "2",
    type: "INVEST",
    project: "GMETA",
    amount: "5,000.00",
    timestamp: "2024-01-10 09:15:42",
    status: "COMPLETED",
    txHash: "0x9abc...def0"
  },
  {
    id: "3",
    type: "WITHDRAW",
    project: "NFTMP",
    amount: "15,000 tokens",
    timestamp: "2024-01-08 16:22:18",
    status: "COMPLETED",
    txHash: "0x2468...ace1"
  }
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("portfolio");

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
              value={`$${mockUserData.balance}`}
              change="Available for investment"
              changeType="neutral"
            />
            <StatCard
              title="Total Invested"
              value={`$${mockUserData.totalInvested}`}
              change={`${mockUserData.totalProjects} projects`}
              changeType="positive"
            />
            <StatCard
              title="Portfolio Value"
              value={`$${mockUserData.portfolioValue}`}
              change={mockUserData.unrealizedGains}
              changeType="positive"
            />
            <StatCard
              title="Total Tokens"
              value={mockUserData.totalTokens}
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
                {mockPortfolioProjects.map((project, index) => (
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
                      >
                        {project.canWithdraw ? 'WITHDRAW TOKENS' : 'TOKENS LOCKED'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
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
                    {mockTransactionHistory.map((tx, index) => (
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
                    {mockPortfolioProjects
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
                          <Button className="w-full btn-pixel text-sm">
                            WITHDRAW {project.tokenSymbol}
                          </Button>
                        </div>
                      ))}
                    {mockPortfolioProjects.filter(project => project.canWithdraw).length === 0 && (
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
                        ${mockUserData.balance}
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
                      />
                    </div>
                    <Button className="w-full btn-pixel-secondary">
                      WITHDRAW USDT
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