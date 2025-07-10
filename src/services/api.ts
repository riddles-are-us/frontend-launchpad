import { createCommand, PlayerConvention, ZKWasmAppRpc } from 'zkwasm-minirollup-rpc';
import type { L1AccountInfo } from 'zkwasm-minirollup-browser';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

// Command constants for IDO launchpad (matching backend)
const TICK = 0;
const INSTALL_PLAYER = 1;
const WITHDRAW_USDT = 2;
const DEPOSIT_USDT = 3;
const INVEST = 4;
const WITHDRAW_TOKENS = 5;
const CREATE_IDO = 6;
const UPDATE_IDO = 7;

// Time constants for IDO scheduling (in ticks, 1 tick = 5 seconds)
export const TIME_CONSTANTS = {
    TICKS_PER_MINUTE: 12n,
    TICKS_PER_HOUR: 720n,
    TICKS_PER_DAY: 17280n,
    TICKS_PER_WEEK: 120960n,
    TICKS_PER_MONTH: 518400n,
    
    // Common durations
    DURATION_1_HOUR: 720n,
    DURATION_6_HOURS: 4320n, 
    DURATION_1_DAY: 17280n,
    DURATION_3_DAYS: 51840n,
    DURATION_1_WEEK: 120960n,
    DURATION_2_WEEKS: 241920n,
    DURATION_1_MONTH: 518400n,
    
    // Common delays
    DELAY_5_MINUTES: 60n,
    DELAY_30_MINUTES: 360n,
    DELAY_1_HOUR: 720n,
    DELAY_6_HOURS: 4320n,
    DELAY_1_DAY: 17280n,
    DELAY_1_WEEK: 120960n,
};

// TypeScript interfaces for IDO data structures
export interface IdoProjectData {
    projectId: string;
    tokenSymbol: string;
    projectName?: string; // Will be derived from tokenSymbol or added separately
    description?: string; // Add description field
    targetAmount: string;
    tokenSupply: string;
    maxIndividualCap: string;
    startTime: string;
    endTime: string;
    totalRaised: string;
    totalInvestors: string;
    isOverSubscribed: boolean;
    tokenPrice: string;
    createdTime: string;
    status: 'PENDING' | 'ACTIVE' | 'ENDED';
    progress: number;
}

export interface InvestmentData {
    index: string;
    pid: string[];
    projectId: string;
    amount: string;
    timestamp: string;
    transactionType: 'INVEST';
    txHash?: string;
}

export interface WithdrawalData {
    index: string;
    pid: string[];
    projectId: string;
    tokenAmount: string;
    refundAmount: string;
    timestamp: string;
    transactionType: 'WITHDRAW_TOKENS';
    txHash?: string;
}

export interface UserProjectPosition {
    pid: string[];
    projectId: string;
    investedAmount: string;
    tokensWithdrawn: boolean;
    refundWithdrawn: boolean;
    investmentTime: string;
    tokenSymbol: string;
    projectName?: string;
    currentValue?: string;
    gainLoss?: string;
    gainLossPercent?: string;
    canWithdraw: boolean;
    status: 'PENDING' | 'ACTIVE' | 'ENDED';
}

export interface UserStats {
    balance: string;
    totalInvested: string;
    totalTokens: string;
    totalProjects: string;
    portfolioValue: string;
    unrealizedGains: string;
}

export interface TransactionHistory {
    id: string;
    type: 'INVEST' | 'WITHDRAW' | 'REFUND';
    project: string;
    amount: string;
    timestamp: string;
    status: 'COMPLETED' | 'PENDING' | 'FAILED';
    txHash: string;
}

interface ServerConfig {
    serverUrl: string;
    privkey: string;
}

export class LaunchpadAPI extends PlayerConvention {
    private privkey: string;
    private baseUrl: string;
    
    constructor(config: ServerConfig) {
        const rpc = new ZKWasmAppRpc(config.serverUrl);
        super(config.privkey, rpc, BigInt(DEPOSIT_USDT), BigInt(WITHDRAW_USDT));
        this.privkey = config.privkey;
        this.rpc = rpc;
        this.processingKey = config.privkey;
        this.baseUrl = config.serverUrl;
    }

    // Utility method to send transaction with command
    async sendTransactionWithCommand(cmd: BigUint64Array) {
        try {
            let result = await this.rpc.sendTransaction(cmd, this.processingKey);
            return result;
        } catch (e) {
            if (e instanceof Error) {
                console.log(e.message);
            }
            throw e;
        }
    }

    // Install/Register Player
    async installPlayer(): Promise<any> {
        try {
            const command = createCommand(0n, BigInt(INSTALL_PLAYER), []);
            return await this.sendTransactionWithCommand(command);
        } catch (e) {
            if (e instanceof Error && (e.message === "PlayerAlreadyExist" || e.message === "PlayerAlreadyExists")) {
                console.log("Player already installed, continuing...");
                return { success: true, message: "Player already installed" };
            }
            throw e;
        }
    }

    // Invest in IDO project
    async investInProject(projectId: bigint, amount: bigint): Promise<any> {
        let nonce = await this.getNonce();
        let cmd = createCommand(nonce, BigInt(INVEST), [projectId, amount]);
        return await this.sendTransactionWithCommand(cmd);
    }

    // Withdraw allocated tokens after project finalization
    async withdrawTokens(projectId: bigint): Promise<any> {
        let nonce = await this.getNonce();
        let cmd = createCommand(nonce, BigInt(WITHDRAW_TOKENS), [projectId]);
        return await this.sendTransactionWithCommand(cmd);
    }

    // Withdraw USDT to external address
    async withdrawUsdt(amount: bigint, addressHigh: bigint, addressLow: bigint): Promise<any> {
        let nonce = await this.getNonce();
        let cmd = createCommand(nonce, BigInt(WITHDRAW_USDT), [0n, amount, addressHigh, addressLow]);
        return await this.sendTransactionWithCommand(cmd);
    }

    // Admin only: Create new IDO project
    async createIdoProject(
        tokenSymbol: string,
        targetAmount: bigint,
        tokenSupply: bigint,
        maxIndividualCap: bigint,
        startTimeOffset: bigint,
        endTimeOffset: bigint
    ): Promise<any> {
        if (tokenSymbol.length > 8) {
            throw new Error("Token symbol must be 8 characters or less");
        }

        let nonce = await this.getNonce();
        const tokenSymbolU64Array = this.stringToU64Array(tokenSymbol);
        const tokenSymbolU64 = tokenSymbolU64Array[0] || 0n;

        const params = [
            tokenSymbolU64,
            targetAmount,
            tokenSupply,
            maxIndividualCap,
            startTimeOffset,
            endTimeOffset
        ];
        
        let cmd = createCommand(nonce, BigInt(CREATE_IDO), params);
        return await this.sendTransactionWithCommand(cmd);
    }

    // Admin only: Update IDO project individual cap
    async updateIdoProjectCap(projectId: bigint, newMaxIndividualCap: bigint): Promise<any> {
        let nonce = await this.getNonce();
        let cmd = createCommand(nonce, BigInt(UPDATE_IDO), [projectId, 1n, newMaxIndividualCap]);
        return await this.sendTransactionWithCommand(cmd);
    }

    // Admin only: Update IDO project end time
    async updateIdoProjectEndTime(projectId: bigint, newEndTimeOffset: bigint): Promise<any> {
        let nonce = await this.getNonce();
        let cmd = createCommand(nonce, BigInt(UPDATE_IDO), [projectId, 2n, newEndTimeOffset]);
        return await this.sendTransactionWithCommand(cmd);
    }

    // Get all IDO projects - Fixed to use HTTP fetch
    async getAllProjects(): Promise<IdoProjectData[]> {
        try {
            const response = await fetch(`${this.baseUrl}/data/idos`);
            const result = await response.json() as any;
            if (!result.success) {
                throw new Error(result.message || 'Failed to get projects data');
            }
            return result.data.map((project: any) => this.formatProjectData(project));
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        }
    }

    // Get specific project data - Fixed to use HTTP fetch
    async getProject(projectId: string): Promise<IdoProjectData> {
        try {
            const response = await fetch(`${this.baseUrl}/data/ido/${projectId}`);
            const result = await response.json() as any;
            if (!result.success) {
                throw new Error(result.message || 'Failed to get project data');
            }
            return this.formatProjectData(result.data);
        } catch (error) {
            console.error('Error fetching project:', error);
            throw error;
        }
    }

    // Get user's investment history - Fixed to use HTTP fetch
    async getUserInvestments(pid1: string, pid2: string): Promise<InvestmentData[]> {
        try {
            const response = await fetch(`${this.baseUrl}/data/user/${pid1}/${pid2}/investments`);
            if (response.status === 404) {
                return []; // User has no investments
            }
            const result = await response.json() as any;
            if (!result.success) {
                throw new Error(result.message || 'Failed to get user investments');
            }
            return result.data;
        } catch (error) {
            console.error('Error fetching user investments:', error);
            return [];
        }
    }

    // Get user's withdrawal history - Fixed to use HTTP fetch
    async getUserWithdrawals(pid1: string, pid2: string): Promise<WithdrawalData[]> {
        try {
            const response = await fetch(`${this.baseUrl}/data/user/${pid1}/${pid2}/withdrawals`);
            if (response.status === 404) {
                return []; // User has no withdrawals
            }
            const result = await response.json() as any;
            if (!result.success) {
                throw new Error(result.message || 'Failed to get user withdrawals');
            }
            return result.data;
        } catch (error) {
            console.error('Error fetching user withdrawals:', error);
            return [];
        }
    }

    // Get user's position in specific project - Fixed to use HTTP fetch
    async getUserProjectPosition(pid1: string, pid2: string, projectId: string): Promise<UserProjectPosition> {
        try {
            const response = await fetch(`${this.baseUrl}/data/user/${pid1}/${pid2}/project/${projectId}/position`);
            if (response.status === 404) {
                throw new Error('User has no position in this project');
            }
            const result = await response.json() as any;
            if (!result.success) {
                throw new Error(result.message || 'Failed to get user project position');
            }
            return this.formatUserPosition(result.data);
        } catch (error) {
            console.error('Error fetching user project position:', error);
            throw error;
        }
    }

    // Get user's all project positions - Fixed to use HTTP fetch
    async getUserAllPositions(pid1: string, pid2: string): Promise<UserProjectPosition[]> {
        try {
            const response = await fetch(`${this.baseUrl}/data/user/${pid1}/${pid2}/positions`);
            if (response.status === 404) {
                return []; // User has no positions
            }
            const result = await response.json() as any;
            if (!result.success) {
                throw new Error(result.message || 'Failed to get user positions');
            }
            return result.data.map((position: any) => this.formatUserPosition(position));
        } catch (error) {
            console.error('Error fetching user positions:', error);
            return [];
        }
    }

    // Get user stats (derived from investments and positions) - Fixed to use HTTP fetch
    async getUserStats(pid1: string, pid2: string): Promise<UserStats | null> {
        try {
            const [investments, positions] = await Promise.all([
                this.getUserInvestments(pid1, pid2),
                this.getUserAllPositions(pid1, pid2)
            ]);

            const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
            const totalProjects = positions.length;
            
            // Calculate portfolio value and unrealized gains
            let portfolioValue = 0;
            let totalTokens = 0;

            for (const position of positions) {
                // This would need real-time token pricing in a production app
                portfolioValue += parseFloat(position.investedAmount);
                totalTokens += 1; // Placeholder - would need actual token count
            }

            const unrealizedGains = portfolioValue - totalInvested;

            return {
                balance: "0", // Would need to fetch from wallet/account balance
                totalInvested: totalInvested.toString(),
                totalTokens: totalTokens.toString(),
                totalProjects: totalProjects.toString(),
                portfolioValue: portfolioValue.toString(),
                unrealizedGains: unrealizedGains.toString()
            };
        } catch (error) {
            console.error('Error calculating user stats:', error);
            return null;
        }
    }

    // Get user transaction history (combination of investments and withdrawals) - Fixed to use HTTP fetch
    async getUserTransactionHistory(pid1: string, pid2: string): Promise<TransactionHistory[]> {
        try {
            const [investments, withdrawals] = await Promise.all([
                this.getUserInvestments(pid1, pid2),
                this.getUserWithdrawals(pid1, pid2)
            ]);

            const transactions: TransactionHistory[] = [];

            // Add investments
            investments.forEach((inv, index) => {
                transactions.push({
                    id: `inv_${index}`,
                    type: 'INVEST',
                    project: inv.projectId,
                    amount: inv.amount,
                    timestamp: inv.timestamp,
                    status: 'COMPLETED',
                    txHash: inv.txHash || `0x${inv.index}`
                });
            });

            // Add withdrawals
            withdrawals.forEach((withdrawal, index) => {
                transactions.push({
                    id: `with_${index}`,
                    type: 'WITHDRAW',
                    project: withdrawal.projectId,
                    amount: withdrawal.tokenAmount,
                    timestamp: withdrawal.timestamp,
                    status: 'COMPLETED',
                    txHash: withdrawal.txHash || `0x${withdrawal.index}`
                });
            });

            // Sort by timestamp (newest first)
            return transactions.sort((a, b) => 
                parseInt(b.timestamp) - parseInt(a.timestamp)
            );
        } catch (error) {
            console.error('Error fetching transaction history:', error);
            return [];
        }
    }

    // Get project investment history - Fixed to use HTTP fetch
    async getProjectInvestments(projectId: string): Promise<InvestmentData[]> {
        try {
            const response = await fetch(`${this.baseUrl}/data/ido/${projectId}/investors`);
            const result = await response.json() as any;
            if (!result.success) {
                throw new Error(result.message || 'Failed to get project investments');
            }
            return result.data;
        } catch (error) {
            console.error('Error fetching project investments:', error);
            return [];
        }
    }

    // Utility functions
    private formatProjectData(project: any): IdoProjectData {
        const currentTime = BigInt(Math.floor(Date.now() / 1000));
        const startTime = BigInt(project.startTime);
        const endTime = BigInt(project.endTime);
        const totalRaised = BigInt(project.totalRaised);
        const targetAmount = BigInt(project.targetAmount);

        let status: 'PENDING' | 'ACTIVE' | 'ENDED';
        if (currentTime < startTime) {
            status = 'PENDING';
        } else if (currentTime < endTime) {
            status = 'ACTIVE';
        } else {
            status = 'ENDED';
        }

        const progress = targetAmount > 0n ? Number((totalRaised * 100n) / targetAmount) : 0;
        const isOverSubscribed = totalRaised > targetAmount;
        const tokenPrice = this.calculateTokenPrice(targetAmount, BigInt(project.tokenSupply));

        // Handle tokenSymbol - it might already be a string or need conversion
        let tokenSymbol: string;
        if (typeof project.tokenSymbol === 'string') {
            tokenSymbol = project.tokenSymbol;
        } else if (typeof project.tokenSymbol === 'number' || typeof project.tokenSymbol === 'bigint') {
            tokenSymbol = this.u64ToString(BigInt(project.tokenSymbol));
        } else {
            tokenSymbol = 'UNKNOWN';
        }

        return {
            projectId: project.projectId,
            tokenSymbol: tokenSymbol,
            projectName: `${tokenSymbol} Project`, // Add project name based on token symbol
            description: project.description || "Example project description", // Add description with fallback
            targetAmount: project.targetAmount,
            tokenSupply: project.tokenSupply,
            maxIndividualCap: project.maxIndividualCap,
            startTime: project.startTime,
            endTime: project.endTime,
            totalRaised: project.totalRaised,
            totalInvestors: project.investorCount || '0',
            isOverSubscribed,
            tokenPrice,
            createdTime: project.createdTime || '0',
            status,
            progress: Math.min(progress, 100)
        };
    }

    private formatUserPosition(position: any): UserProjectPosition {
        const currentTime = BigInt(Math.floor(Date.now() / 1000));
        const endTime = BigInt(position.endTime || '0');
        
        let status: 'PENDING' | 'ACTIVE' | 'ENDED';
        if (currentTime < endTime) {
            status = 'ACTIVE';
        } else {
            status = 'ENDED';
        }

        return {
            ...position,
            canWithdraw: status === 'ENDED' && !position.tokensWithdrawn,
            status
        };
    }

    private calculateTokenPrice(targetAmount: bigint, tokenSupply: bigint): string {
        if (tokenSupply === 0n) return "0";
        return (Number(targetAmount) / Number(tokenSupply)).toFixed(6);
    }

    private stringToU64Array(str: string): bigint[] {
        const result: bigint[] = [];
        const chunks = Math.ceil(str.length / 8);
        
        for (let i = 0; i < chunks; i++) {
            const chunk = str.slice(i * 8, (i + 1) * 8);
            let value = 0n;
            
            for (let j = 0; j < chunk.length; j++) {
                value |= BigInt(chunk.charCodeAt(j)) << BigInt(j * 8);
            }
            
            result.push(value);
        }
        
        return result;
    }

    private u64ToString(u64Value: bigint): string {
        let result = '';
        let value = u64Value;
        
        while (value > 0n) {
            const charCode = Number(value & 0xFFn);
            if (charCode === 0) break;
            result += String.fromCharCode(charCode);
            value >>= 8n;
        }
        
        return result;
    }

    // Calculate token allocation for user
    calculateTokenAllocation(
        userInvestment: bigint,
        totalRaised: bigint,
        tokenSupply: bigint,
        targetAmount: bigint,
        isOverSubscribed: boolean
    ): { allocatedTokens: bigint, refundAmount: bigint } {
        if (totalRaised === 0n) {
            return { allocatedTokens: 0n, refundAmount: 0n };
        }

        if (isOverSubscribed) {
            // Over-subscribed - calculate proportional allocation and refund
            const allocationRatio = (targetAmount * 1000000n) / totalRaised; // Using precision
            const allocatedInvestment = (userInvestment * allocationRatio) / 1000000n;
            const allocatedTokens = (allocatedInvestment * tokenSupply) / targetAmount;
            const refundAmount = userInvestment - allocatedInvestment;
            return { allocatedTokens, refundAmount };
        } else {
            // Normal allocation - no refund
            const allocatedTokens = (userInvestment * tokenSupply) / targetAmount;
            return { allocatedTokens, refundAmount: 0n };
        }
    }

    // Validate investment
    validateInvestment(
        amount: bigint,
        userCurrentInvestment: bigint,
        maxIndividualCap: bigint,
        currentTime: bigint,
        startTime: bigint,
        endTime: bigint
    ): { isValid: boolean, error?: string } {
        // Check if project is active
        if (currentTime < startTime) {
            return { isValid: false, error: "Investment period has not started yet" };
        }
        
        if (currentTime >= endTime) {
            return { isValid: false, error: "Investment period has ended" };
        }

        // Check investment amount
        if (amount <= 0n) {
            return { isValid: false, error: "Investment amount must be greater than 0" };
        }

        // Check individual cap
        const totalInvestment = userCurrentInvestment + amount;
        if (totalInvestment > maxIndividualCap) {
            return { isValid: false, error: `Investment would exceed individual cap of ${maxIndividualCap}` };
        }

        return { isValid: true };
    }
}

// Export default instance factory
export const createLaunchpadAPI = (config: ServerConfig) => {
    return new LaunchpadAPI(config);
};

export default LaunchpadAPI; 

// Static method to get projects without authentication
export const getPublicProjects = async (): Promise<IdoProjectData[]> => {
    try {
        const serverUrl = process.env.REACT_APP_ZKWASM_SERVER_URL || "http://localhost:3000";
        const url = `${serverUrl}/data/idos`;
        console.log('Public API: Fetching projects from URL:', url);
        
        const response = await fetch(url);
        console.log('Public API: Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json() as any;
        console.log('Public API: Raw response data:', result);
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to get projects data');
        }
        
        return result.data.map((project: any) => formatPublicProjectData(project));
    } catch (error) {
        console.error('Failed to get public projects:', error);
        throw error;
    }
};

// Helper function to format project data without class context
const formatPublicProjectData = (project: any): IdoProjectData => {
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    const startTime = BigInt(project.startTime);
    const endTime = BigInt(project.endTime);
    const totalRaised = BigInt(project.totalRaised);
    const targetAmount = BigInt(project.targetAmount);

    let status: 'PENDING' | 'ACTIVE' | 'ENDED';
    if (currentTime < startTime) {
        status = 'PENDING';
    } else if (currentTime < endTime) {
        status = 'ACTIVE';
    } else {
        status = 'ENDED';
    }

    const progress = targetAmount > 0n ? Number((totalRaised * 100n) / targetAmount) : 0;
    const isOverSubscribed = totalRaised > targetAmount;
    const tokenPrice = calculatePublicTokenPrice(targetAmount, BigInt(project.tokenSupply));

    // Handle tokenSymbol - it might already be a string or need conversion
    let tokenSymbol: string;
    if (typeof project.tokenSymbol === 'string') {
        tokenSymbol = project.tokenSymbol;
    } else if (typeof project.tokenSymbol === 'number' || typeof project.tokenSymbol === 'bigint') {
        tokenSymbol = u64ToStringPublic(BigInt(project.tokenSymbol));
    } else {
        tokenSymbol = 'UNKNOWN';
    }

    return {
        projectId: project.projectId,
        tokenSymbol: tokenSymbol,
        projectName: `${tokenSymbol} Project`, // Add project name based on token symbol
        description: project.description || "Example project description", // Add description with fallback
        targetAmount: project.targetAmount,
        tokenSupply: project.tokenSupply,
        maxIndividualCap: project.maxIndividualCap,
        startTime: project.startTime,
        endTime: project.endTime,
        totalRaised: project.totalRaised,
        totalInvestors: project.investorCount || '0',
        isOverSubscribed,
        tokenPrice,
        createdTime: project.createdTime || '0',
        status,
        progress: Math.min(progress, 100)
    };
};

const calculatePublicTokenPrice = (targetAmount: bigint, tokenSupply: bigint): string => {
    if (tokenSupply === 0n) return "0";
    return (Number(targetAmount) / Number(tokenSupply)).toFixed(6);
};

const u64ToStringPublic = (u64Value: bigint): string => {
    if (u64Value === 0n) return "";
    
    const bytes = [];
    let value = u64Value;
    
    while (value > 0n) {
        bytes.push(Number(value & 0xFFn));
        value = value >> 8n;
    }
    
    // Convert bytes to string, removing null terminators
    return String.fromCharCode(...bytes.filter(b => b !== 0));
}; 