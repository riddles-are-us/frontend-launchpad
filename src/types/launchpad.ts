// Import and re-export types from the API service for consistency
import type {
    IdoProjectData,
    InvestmentData,
    WithdrawalData,
    UserProjectPosition,
    UserStats,
    TransactionHistory
} from '../services/api';

export type {
    IdoProjectData,
    InvestmentData,
    WithdrawalData,
    UserProjectPosition,
    UserStats,
    TransactionHistory
};

// Additional types specific to the UI components
export interface ProjectCardProps {
    project: IdoProjectData;
    onInvest?: (projectId: string, amount: string) => void;
    onViewDetails?: (projectId: string) => void;
}

export interface DashboardStats {
    balance: string;
    totalInvested: string;
    totalTokens: string;
    totalProjects: string;
    portfolioValue: string;
    unrealizedGains: string;
}

export interface PortfolioProject {
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
}

export interface WalletInfo {
    address: string;
    isConnected: boolean;
    balance: string;
    pid: [string, string];
}

export interface ProjectFilters {
    status: 'ALL' | 'PENDING' | 'ACTIVE' | 'ENDED';
    sortBy: 'newest' | 'oldest' | 'progress' | 'targetAmount';
    searchTerm: string;
}

export interface InvestmentForm {
    amount: string;
    projectId: string;
}

export interface WithdrawalForm {
    projectId: string;
    tokenAmount: string;
    refundAmount: string;
}

// Configuration types
export interface LaunchpadConfig {
    serverUrl: string;
    privkey: string;
    apiBaseUrl: string;
}

// Error types
export interface LaunchpadError {
    code: string;
    message: string;
    details?: any;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: LaunchpadError;
    message?: string;
}

// Transaction states
export type TransactionStatus = 'IDLE' | 'PENDING' | 'LOADING' | 'SUCCESS' | 'ERROR';

export interface TransactionState {
    status: TransactionStatus;
    type?: 'INVEST' | 'WITHDRAW_TOKENS' | 'WITHDRAW_POINTS';
    error?: string;
    txHash?: string;
}

// Context types
export interface LaunchpadContextType {
    // API instance
    api: any | null;
    
    // Connection state
    isConnected: boolean;
    walletInfo: WalletInfo | null;
    
    // Data
    projects: any[];
    userPositions: any[];
    userStats: any | null; // Allow null for when user has no stats
    transactionHistory: any[];
    globalCounter: number; // Current global counter from RPC query
    
    // UI state
    loading: boolean;
    error: string | null;
    transactionState: any;
    
    // Actions
    connect: () => void;
    disconnect: () => void;
    refreshData: () => Promise<void>;
    investInProject: (projectId: string, amount: string) => Promise<any>;
    withdrawTokens: (projectId: string, address: string) => Promise<any>;
    withdrawPoints: (amount: string) => Promise<any>;
}

// Hook return types
export interface UseProjectsReturn {
    projects: IdoProjectData[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export interface UseUserPortfolioReturn {
    positions: UserProjectPosition[];
    stats: UserStats | null;
    transactionHistory: TransactionHistory[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export interface UseInvestmentReturn {
    invest: (projectId: string, amount: string) => Promise<void>;
    withdraw: (projectId: string) => Promise<void>;
    transaction: TransactionState;
}

// Utility types
export type ProjectStatus = 'PENDING' | 'ACTIVE' | 'ENDED';
export type TransactionType = 'INVEST' | 'WITHDRAW' | 'REFUND';

// Constants
export const PROJECT_STATUSES: Record<ProjectStatus, string> = {
    PENDING: 'Pending',
    ACTIVE: 'Active',
    ENDED: 'Ended'
};

export const TRANSACTION_TYPES: Record<TransactionType, string> = {
    INVEST: 'Investment',
    WITHDRAW: 'Withdrawal',
    REFUND: 'Refund'
};

 