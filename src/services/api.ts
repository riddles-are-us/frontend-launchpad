import { createCommand, createWithdrawCommand, PlayerConvention, ZKWasmAppRpc } from 'zkwasm-minirollup-rpc';
import type { L1AccountInfo } from 'zkwasm-minirollup-browser';
import { getProjectDescriptionText } from '../utils/project-descriptions';


// Command constants for IDO launchpad (matching backend)
const TICK = 0;
const INSTALL_PLAYER = 1;
const WITHDRAW_POINTS = 2;
const DEPOSIT_POINTS = 3;
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

export interface TokenInfo {
    token_uid: number | string; // Allow both number and string for large values
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
        super(config.privkey, rpc, BigInt(DEPOSIT_POINTS), BigInt(WITHDRAW_POINTS));
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
    async withdrawTokens(projectId: bigint, address: string): Promise<any> {
        let nonce = await this.getNonce();
        // Use placeholder amount (1n) - actual amount will be calculated by smart contract
        // Use projectId as tokenIndex since they map to the same concept
        let cmd = createWithdrawCommand(nonce, BigInt(WITHDRAW_TOKENS), address, projectId, 1n);
        return await this.sendTransactionWithCommand(cmd);
    }

    // Withdraw ZKWASM Points to external address
    async withdrawPoints(amount: bigint, address: string): Promise<any> {
        let nonce = await this.getNonce();
        // Use tokenIndex 0 for points (USDT equivalent)
        let cmd = createWithdrawCommand(nonce, BigInt(WITHDRAW_POINTS), address, 0n, amount);
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

    // Query all tokens from deposit contract using blockchain RPC
    async getAllTokens(): Promise<TokenInfo[]> {
        try {
            console.log('LaunchpadAPI: Querying all tokens via blockchain RPC...');
            
            // Get environment variables for blockchain RPC and contract address
            const rpcUrl = import.meta.env.REACT_APP_RPC_URL;
            const rawContractAddress = import.meta.env.REACT_APP_DEPOSIT_CONTRACT;
            
            if (!rpcUrl || !rawContractAddress) {
                console.error('LaunchpadAPI: Missing RPC URL or deposit contract address');
                return [];
            }
            
            // Clean and validate contract address
            let cleanAddress = rawContractAddress.trim();
            
            // Remove surrounding quotes if present
            if ((cleanAddress.startsWith('"') && cleanAddress.endsWith('"')) ||
                (cleanAddress.startsWith("'") && cleanAddress.endsWith("'"))) {
                cleanAddress = cleanAddress.slice(1, -1);
            }
            
            // Remove 0x prefix if present for validation
            if (cleanAddress.startsWith('0x')) {
                cleanAddress = cleanAddress.slice(2);
            }
            
            // Validate address length (should be 40 hex characters)
            if (cleanAddress.length !== 40) {
                console.error(`LaunchpadAPI: Invalid contract address length: ${cleanAddress.length}, expected 40. Address: ${rawContractAddress}`);
                return [];
            }
            
            // Validate hex characters
            if (!/^[0-9a-fA-F]{40}$/.test(cleanAddress)) {
                console.error(`LaunchpadAPI: Invalid contract address format: ${rawContractAddress}`);
                return [];
            }
            
            // Add 0x prefix
            const depositContractAddress = `0x${cleanAddress}`;
            console.log('LaunchpadAPI: Using contract address:', depositContractAddress);
            
            // Prepare the RPC call to query allTokens() method
            // Function signature: allTokens() -> TokenInfo[]
            // For "allTokens()" the correct function selector should be calculated
            // Let me try a few possible selectors:
            
            // Correct function selector for allTokens()
            // keccak256("allTokens()") = 6ff97f1d9d3a9541d333d7f77e612f681ebccec0dacddcfd4fea206794d35602
            // Function selector = first 4 bytes = 0x6ff97f1d
            const functionSelector = '0x6ff97f1d';
            
            console.log('LaunchpadAPI: Using function selector:', functionSelector);
            console.log('LaunchpadAPI: Contract address:', depositContractAddress);
            
            const rpcPayload = {
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_call',
                params: [{
                    to: depositContractAddress,
                    data: functionSelector
                }, 'latest']
            };
            
            console.log('LaunchpadAPI: Sending RPC request:', rpcPayload);
            
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(rpcPayload)
            });
            
            if (!response.ok) {
                throw new Error(`RPC request failed: ${response.status}`);
            }
            
            const rpcResult = await response.json();
            console.log('LaunchpadAPI: RPC response:', rpcResult);
            
            if (rpcResult.error) {
                console.error(`LaunchpadAPI: RPC error: ${rpcResult.error.message}`);
                // If the function doesn't exist or reverted, return empty array
                if (rpcResult.error.message.includes('execution reverted')) {
                    console.log('LaunchpadAPI: Contract function reverted, possibly no tokens available or function not implemented');
                    return [];
                }
                throw new Error(`RPC error: ${rpcResult.error.message}`);
            }
            
            if (!rpcResult.result || rpcResult.result === '0x') {
                console.log('LaunchpadAPI: No tokens found in contract or empty response');
                return [];
            }
            
            // Decode the returned data
            // The result is hex-encoded ABI data for TokenInfo[] array
            const hexData = rpcResult.result;
            const tokens = this.decodeTokensArray(hexData);
            
            console.log('LaunchpadAPI: Decoded tokens:', tokens);
            return tokens;
            
        } catch (error) {
            console.error('LaunchpadAPI: Error querying tokens via blockchain RPC:', error);
            return [];
        }
    }

    // Helper method to decode TokenInfo[] array from hex data
    private decodeTokensArray(hexData: string): TokenInfo[] {
        try {
            // Remove '0x' prefix
            const data = hexData.startsWith('0x') ? hexData.slice(2) : hexData;
            
            if (data.length === 0) {
                return [];
            }
            
            // Parse ABI-encoded array
            // First 32 bytes (64 hex chars) contain offset to array data (should be 0x20 = 32)
            // Next 32 bytes contain array length
            // Then each element is 32 bytes (uint256)
            
            if (data.length < 128) { // At least offset + length
                return [];
            }
            
            const offsetHex = data.slice(0, 64); // First 32 bytes
            const arrayLengthHex = data.slice(64, 128); // Second 32 bytes
            const arrayLength = parseInt(arrayLengthHex, 16);
            
            console.log('LaunchpadAPI: Decoding array with offset:', offsetHex, 'length:', arrayLength);
            
            if (arrayLength === 0) {
                return [];
            }
            
            const tokens: TokenInfo[] = [];
            
            // Each token_uid is 32 bytes (64 hex chars)
            for (let i = 0; i < arrayLength; i++) {
                const startIndex = 128 + (i * 64); // Skip offset + length, then each 32-byte element
                const endIndex = startIndex + 64;
                
                if (endIndex <= data.length) {
                    const tokenUidHex = data.slice(startIndex, endIndex);
                    console.log(`LaunchpadAPI: Token ${i} hex:`, tokenUidHex);
                    
                    // Use BigInt for large numbers and keep as string to maintain precision
                    const tokenUidBigInt = BigInt('0x' + tokenUidHex);
                    console.log(`LaunchpadAPI: Token ${i} BigInt:`, tokenUidBigInt.toString());
                    console.log(`LaunchpadAPI: Token ${i} hex analysis:`, tokenUidHex);
                    
                    // Let's also check if the hex contains an address directly
                    // The last 40 characters of the hex might be the address
                    const possibleAddressHex = tokenUidHex.slice(-40);
                    console.log(`LaunchpadAPI: Token ${i} possible address from hex:`, '0x' + possibleAddressHex);
                    
                    // Keep as string to maintain precision for large numbers
                    const tokenUid = tokenUidBigInt.toString();
                    
                    console.log(`LaunchpadAPI: Token ${i} final value:`, tokenUid);
                    
                    if (tokenUidBigInt > 0n) {
                        tokens.push({ token_uid: tokenUid });
                    }
                }
            }
            
            return tokens;
            
        } catch (error) {
            console.error('LaunchpadAPI: Error decoding tokens array:', error);
            return [];
        }
    }

    // Convert token UID to L1 address
    tokenUidToL1Address(tokenUid: number | string, chainId: number = 56): string {
        try {
            // Convert tokenUid to BigInt and then to hex
            const tokenUidBigInt = typeof tokenUid === 'string' ? BigInt(tokenUid) : BigInt(tokenUid);
            const tokenUidHex = tokenUidBigInt.toString(16).padStart(64, '0');
            
            console.log(`LaunchpadAPI: Converting tokenUid ${tokenUid} to hex:`, tokenUidHex);
            
            // Extract the last 40 characters (20 bytes) which represent the address
            const addressHex = tokenUidHex.slice(-40);
            const address = `0x${addressHex}`;
            
            console.log(`LaunchpadAPI: Extracted address: ${address}`);
            
            // Verify the extracted address looks valid
            if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
                console.error('LaunchpadAPI: Invalid address format extracted:', address);
                return '0x0000000000000000000000000000000000000000';
            }
            
            return address;
            
        } catch (error) {
            console.error('LaunchpadAPI: Error converting tokenUid to address:', error);
            return '0x0000000000000000000000000000000000000000';
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
                // Calculate actual token allocation based on 80% distributable supply
                const userInvestment = BigInt(position.investedAmount);
                
                // Only count portfolio value if tokens haven't been withdrawn
                if (!position.tokensWithdrawn) {
                    // We need project data to calculate proper allocation
                    // For now, use invested amount as portfolio value (placeholder)
                    // In production, this should fetch current token prices and calculate real value
                    portfolioValue += parseFloat(position.investedAmount);
                    totalTokens += 1; // Placeholder - would need actual token count from allocation calculation
                }
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
    private formatProjectData(project: any, globalCounter?: number): IdoProjectData {
        const totalRaised = BigInt(project.totalRaised);
        const targetAmount = BigInt(project.targetAmount);

        // Calculate progress first (needed for status determination)
        const progress = targetAmount > 0n ? Number((totalRaised * 100n) / targetAmount) : 0;

        let status: 'PENDING' | 'ACTIVE' | 'ENDED';
        if (globalCounter !== undefined) {
            // Use counter-based status calculation
            const startTime = parseInt(project.startTime);
            const endTime = parseInt(project.endTime);
            
            if (globalCounter < startTime) {
                status = 'PENDING';
            } else if (globalCounter < endTime) {
                status = 'ACTIVE';
            } else {
                // ENDED only if time is up AND progress reached 100%
                // Otherwise keep it ACTIVE
                status = progress >= 100 ? 'ENDED' : 'ACTIVE';
            }
        } else {
            // Fallback to time-based calculation if counter not available
            const currentTime = BigInt(Math.floor(Date.now() / 1000));
            const startTime = BigInt(project.startTime);
            const endTime = BigInt(project.endTime);
            
            if (currentTime < startTime) {
                status = 'PENDING';
            } else if (currentTime < endTime) {
                status = 'ACTIVE';
            } else {
                // ENDED only if time is up AND progress reached 100%
                // Otherwise keep it ACTIVE
                status = progress >= 100 ? 'ENDED' : 'ACTIVE';
            }
        }
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
            description: project.description || getProjectDescriptionText(project.projectId), // Add description with fallback
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
        // Note: This method can only determine basic status from time
        // For accurate ENDED status (requires progress >= 100%), 
        // the status should be recalculated in the consuming component (e.g., Dashboard)
        // where both project data and position data are available
        const currentTime = BigInt(Math.floor(Date.now() / 1000));
        const endTime = BigInt(position.endTime || '0');
        
        let status: 'PENDING' | 'ACTIVE' | 'ENDED';
        if (currentTime < endTime) {
            status = 'ACTIVE';
        } else {
            // Mark as ENDED here, but note that this is preliminary
            // The actual ENDED status should consider progress >= 100%
            // This will be recalculated in Dashboard with full project data
            status = 'ENDED';
        }

        return {
            ...position,
            // canWithdraw will be recalculated in Dashboard with accurate status
            canWithdraw: status === 'ENDED' && !position.tokensWithdrawn,
            status
        };
    }

    private calculateTokenPrice(targetAmount: bigint, tokenSupply: bigint): string {
        if (tokenSupply === 0n) return "0";
        // Use 80% of token supply for price calculation (20% reserved for liquidity)
        const distributableSupply = (tokenSupply * 80n) / 100n;
        // Convert points to USDT: 100,000 points = 1 USDT
        const targetAmountInUSDT = Number(targetAmount) / 100000;
        const pricePerToken = targetAmountInUSDT / Number(distributableSupply);
        return this.formatTokenPrice(pricePerToken);
    }

    private formatTokenPrice(price: number): string {
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

    // Calculate token allocation for user (using 80% distributable supply)
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

        // Use 80% of token supply for allocation (20% reserved for liquidity)
        const distributableSupply = (tokenSupply * 80n) / 100n;

        if (isOverSubscribed) {
            // Over-subscribed - calculate proportional allocation and refund
            const allocationRatio = (targetAmount * 1000000n) / totalRaised; // Using precision
            const allocatedInvestment = (userInvestment * allocationRatio) / 1000000n;
            const allocatedTokens = (allocatedInvestment * distributableSupply) / targetAmount;
            const refundAmount = userInvestment - allocatedInvestment;
            return { allocatedTokens, refundAmount };
        } else {
            // Normal allocation - no refund
            const allocatedTokens = (userInvestment * distributableSupply) / targetAmount;
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
export const getPublicProjects = async (globalCounter?: number): Promise<IdoProjectData[]> => {
    try {
        const serverUrl = import.meta.env.REACT_APP_URL || "http://localhost:3000";
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
        
        // Use globalCounter if provided, otherwise fallback to time-based calculation
        return result.data.map((project: any) => formatPublicProjectData(project, globalCounter));
    } catch (error) {
        console.error('Failed to get public projects:', error);
        throw error;
    }
};

// Helper function to format project data without class context
const formatPublicProjectData = (project: any, globalCounter?: number): IdoProjectData => {
    const totalRaised = BigInt(project.totalRaised);
    const targetAmount = BigInt(project.targetAmount);

    // Calculate progress first (needed for status determination)
    const progress = targetAmount > 0n ? Number((totalRaised * 100n) / targetAmount) : 0;

    let status: 'PENDING' | 'ACTIVE' | 'ENDED';
    if (globalCounter !== undefined) {
        // Use counter-based status calculation
        const startTime = parseInt(project.startTime);
        const endTime = parseInt(project.endTime);
        
        if (globalCounter < startTime) {
            status = 'PENDING';
        } else if (globalCounter < endTime) {
            status = 'ACTIVE';
        } else {
            // ENDED only if time is up AND progress reached 100%
            // Otherwise keep it ACTIVE
            status = progress >= 100 ? 'ENDED' : 'ACTIVE';
        }
    } else {
        // Fallback to time-based calculation if counter not available
        const currentTime = BigInt(Math.floor(Date.now() / 1000));
        const startTime = BigInt(project.startTime);
        const endTime = BigInt(project.endTime);
        
        if (currentTime < startTime) {
            status = 'PENDING';
        } else if (currentTime < endTime) {
            status = 'ACTIVE';
        } else {
            // ENDED only if time is up AND progress reached 100%
            // Otherwise keep it ACTIVE
            status = progress >= 100 ? 'ENDED' : 'ACTIVE';
        }
    }
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
        description: project.description || getProjectDescriptionText(project.projectId), // Add description with fallback
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
    // Use 80% of token supply for price calculation (20% reserved for liquidity)
    const distributableSupply = (tokenSupply * 80n) / 100n;
    // Convert points to USDT: 100,000 points = 1 USDT
    const targetAmountInUSDT = Number(targetAmount) / 100000;
    const pricePerToken = targetAmountInUSDT / Number(distributableSupply);
    return formatPublicTokenPrice(pricePerToken);
};

const formatPublicTokenPrice = (price: number): string => {
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