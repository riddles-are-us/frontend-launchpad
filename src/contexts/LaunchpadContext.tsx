import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { LaunchpadAPI, createLaunchpadAPI } from '../services/api';
import { useWallet } from './WalletContext';
import { toast } from '@/hooks/use-toast';
import { bnToHexLe } from 'delphinus-curves/src/altjubjub';
import { LeHexBN } from 'zkwasm-minirollup-rpc';
import type {
    LaunchpadContextType,
    WalletInfo,
    IdoProjectData,
    UserProjectPosition,
    UserStats,
    TransactionHistory,
    TransactionState
} from '../types/launchpad';

interface LaunchpadProviderProps {
    children: React.ReactNode;
    config: {
        serverUrl: string;
        privkey?: string;
    };
}

// Add interface for player state from RPC query
interface PlayerStateData {
    balance: string;
    nonce: string;
}

interface GlobalPlayerState {
    data: PlayerStateData;
}

const LaunchpadContext = createContext<LaunchpadContextType | undefined>(undefined);

export const LaunchpadProvider: React.FC<LaunchpadProviderProps> = ({ children, config }) => {
    console.log('LaunchpadProvider: Component mounted with config:', config);
    
    const [api, setApi] = useState<LaunchpadAPI | null>(null);
    const [projects, setProjects] = useState<IdoProjectData[]>([]);
    const [userPositions, setUserPositions] = useState<UserProjectPosition[]>([]);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transactionState, setTransactionState] = useState<TransactionState>({
        status: 'IDLE'
    });
    const [playerInstalled, setPlayerInstalled] = useState(false);
    const [apiInitializing, setApiInitializing] = useState(false);
    const [userBalance, setUserBalance] = useState<string>("0"); // Add user balance state
    const [fallbackInitialized, setFallbackInitialized] = useState(false); // Track fallback initialization
    const [globalCounter, setGlobalCounter] = useState<number>(0); // Current global counter from RPC

    // Use wallet context from zkWasm SDK
    const walletData = useWallet();
    const { l1Account, l2Account, playerId, setPlayerId, isConnected } = walletData;
    
    console.log('LaunchpadProvider: Wallet state:', {
        hasL1Account: !!l1Account,
        hasL2Account: !!l2Account,
        playerId,
        isConnected
    });

    // Initialize API when L2 account is available OR use fallback for public data
    useEffect(() => {
        console.log('LaunchpadContext: API initialization check:', {
            hasL2Account: !!l2Account,
            hasPrivateKey: !!(l2Account && l2Account.getPrivateKey),
            hasApi: !!api,
            apiInitializing,
            fallbackInitialized
        });
        
        if (l2Account && l2Account.getPrivateKey && !apiInitializing) {
            // If wallet is connected, always reinitialize API with user's private key
            if (fallbackInitialized || !api) {
                console.log('LaunchpadContext: Reinitializing API with wallet private key...');
                setFallbackInitialized(false); // Reset fallback flag when wallet connects
                setApi(null); // Clear existing API instance
                setPlayerInstalled(false); // Reset player installation
                initializeAPI();
            }
        } else if (!l2Account && !apiInitializing) {
            // If no wallet is connected, ensure we have fallback API
            if (!fallbackInitialized || !api) {
                console.log('LaunchpadContext: Initializing/reinitializing API with fallback...');
                setFallbackInitialized(true);
                setApi(null); // Clear any existing API
                setPlayerInstalled(false); // Reset player state
                initializeAPIWithFallback();
            }
        }
    }, [l2Account, api, apiInitializing, fallbackInitialized]);

    // Reset user-specific state when wallet is disconnected
    useEffect(() => {
        if (!l1Account && !l2Account && fallbackInitialized) {
            console.log('LaunchpadContext: Wallet disconnected, resetting user data and switching back to fallback mode');
            setUserPositions([]);
            setUserStats(null);
            setTransactionHistory([]);
            setLoading(false);
            setError(null);
            // Don't reset API or playerInstalled in fallback mode to keep 5s updates working
            // The main initialization effect will handle switching between user and fallback APIs
        }
    }, [l1Account, l2Account, fallbackInitialized]);

    // Auto-install player when L2 is connected and API is ready
    useEffect(() => {
        if (l2Account && !playerInstalled && api) {
            const autoInstall = async () => {
                if (!api || playerInstalled) return;

                try {
                    console.log("Auto-installing player...");
                    const result = await api.installPlayer();
                    console.log("Player installation completed:", result);
                    setPlayerInstalled(true);
                    
                    // Generate player ID from L2 account
                    const generatePlayerIdFromL2 = (): [string, string] | null => {
                        try {
                            if (l2Account.pubkey) {
                                const pubkey = l2Account.pubkey;
                                const leHexBN = new LeHexBN(bnToHexLe(pubkey));
                                const pkeyArray = leHexBN.toU64Array();
                                const playerId: [string, string] = [pkeyArray[1].toString(), pkeyArray[2].toString()];
                                console.log("Generated player ID from L2 account:", playerId);
                                return playerId;
                            }
                            return null;
                        } catch (error) {
                            console.error("Failed to generate player ID from L2:", error);
                            return null;
                        }
                    };
                    
                    const generatedPlayerId = generatePlayerIdFromL2();
                    if (generatedPlayerId) {
                        setPlayerId(generatedPlayerId);
                        console.log("Player ID set from L2 account:", generatedPlayerId);
                    }
                } catch (err) {
                    // Handle PlayerAlreadyExist as success case
                    if (err instanceof Error && (err.message.includes("PlayerAlreadyExist") || err.message.includes("PlayerAlreadyExists"))) {
                        console.log("Player already installed, continuing...");
                        setPlayerInstalled(true);
                        
                        // Still need to generate player ID even if player already exists
                        const generatePlayerIdFromL2 = (): [string, string] | null => {
                            try {
                                if (l2Account.pubkey) {
                                    const pubkey = l2Account.pubkey;
                                    const leHexBN = new LeHexBN(bnToHexLe(pubkey));
                                    const pkeyArray = leHexBN.toU64Array();
                                    const playerId: [string, string] = [pkeyArray[1].toString(), pkeyArray[2].toString()];
                                    console.log("Generated player ID from L2 account:", playerId);
                                    return playerId;
                                }
                                return null;
                            } catch (error) {
                                console.error("Failed to generate player ID from L2:", error);
                                return null;
                            }
                        };
                        
                        const generatedPlayerId = generatePlayerIdFromL2();
                        if (generatedPlayerId) {
                            setPlayerId(generatedPlayerId);
                            console.log("Player ID set from L2 account:", generatedPlayerId);
                        }
                        return;
                    }
                    console.error("Auto-install failed:", err);
                    // Don't throw error for auto-install failures, just log them
                }
            };
            
            autoInstall();
        }
    }, [l2Account, playerInstalled, api]);

    // Set up polling when API is ready and either player is installed OR using fallback
    useEffect(() => {
        console.log('LaunchpadContext: Polling setup check:', {
            hasApi: !!api,
            playerInstalled,
            isConnected
        });
        
        if (api && playerInstalled) {
            console.log("LaunchpadContext: API ready and player installed, starting data polling...");
            
            // Load initial data
            loadInitialData();
            
            // Set up polling interval (every 5 seconds)
            const pollInterval = setInterval(() => {
                console.log('LaunchpadContext: 5-second auto refresh triggered');
                refreshData(false); // false = automatic refresh
            }, 5000);

            return () => {
                console.log('LaunchpadContext: Cleaning up polling interval');
                clearInterval(pollInterval);
            };
        } else {
            console.log('LaunchpadContext: Not starting polling - requirements not met');
        }
    }, [api, playerInstalled]);

    // Initialize API connection
    const initializeAPI = useCallback(() => {
        if (apiInitializing) return;
        
        setApiInitializing(true);
        setError(null);

        try {
            if (!l2Account || !l2Account.getPrivateKey) {
                throw new Error('L2 account not available. Please connect wallet and login to L2 first.');
            }

            console.log('LaunchpadContext: Initializing API with config:', {
                serverUrl: config.serverUrl,
                hasPrivateKey: !!l2Account.getPrivateKey()
            });

            const apiInstance = createLaunchpadAPI({
                serverUrl: config.serverUrl,
                privkey: l2Account.getPrivateKey()
            });
            
            setApi(apiInstance);
            console.log("LaunchpadContext: API initialized successfully with serverUrl:", config.serverUrl);
        } catch (err) {
            console.error('Failed to initialize API:', err);
            setError(err instanceof Error ? err.message : 'Failed to initialize API');
        } finally {
            setApiInitializing(false);
        }
    }, [config, l2Account, apiInitializing]);

    // Initialize API with fallback private key for public data access
    const initializeAPIWithFallback = useCallback(() => {
        if (apiInitializing) return;
        
        setApiInitializing(true);
        setError(null);

        try {
            console.log('LaunchpadContext: Initializing API with fallback private key for public data access');

            // Use a fallback private key for public data access
            const fallbackPrivkey = "000000";

            const apiInstance = createLaunchpadAPI({
                serverUrl: config.serverUrl,
                privkey: fallbackPrivkey
            });
            
            setApi(apiInstance);
            setPlayerInstalled(true); // Set as installed to enable data polling
            console.log("LaunchpadContext: API initialized successfully with fallback private key");
        } catch (err) {
            console.error('Failed to initialize API with fallback:', err);
            setError(err instanceof Error ? err.message : 'Failed to initialize API');
        } finally {
            setApiInitializing(false);
        }
    }, [config, apiInitializing]);

    // Load initial data
    const loadInitialData = useCallback(async () => {
        if (!api) return;
        
        setLoading(true);
        try {
            await refreshData(true); // true = initial load
        } catch (error) {
            console.error('Failed to load initial data:', error);
        } finally {
            setLoading(false);
        }
    }, [api]);

    // Refresh all data
    const refreshData = useCallback(async (isInitialLoad = false) => {
        if (!api) {
            console.log('LaunchpadContext: Cannot refresh data - api not available');
            return;
        }

        try {
            if (!isInitialLoad) {
                // Don't show loading spinner for automatic refreshes
                setError(null);
            }

            console.log('LaunchpadContext: Starting data refresh...');

            let currentBalance = "0.00";
            let globalCounter = 0;

            // Query user balance and global state using RPC if L2 account is available
            if (l2Account && l2Account.getPrivateKey) {
                try {
                    console.log('LaunchpadContext: Querying user balance and global state via RPC...');
                    const rpcResponse: any = await api.rpc.queryState(l2Account.getPrivateKey());
                    console.log('LaunchpadContext: RPC response:', rpcResponse);
                    
                    if (rpcResponse && rpcResponse.success && rpcResponse.data) {
                        // Parse the JSON string in the data field
                        const parsedData = JSON.parse(rpcResponse.data);
                        console.log('LaunchpadContext: Parsed RPC data:', parsedData);
                        
                        if (parsedData.player && parsedData.player.data && parsedData.player.data.balance) {
                            // Don't convert balance, use raw value for now to see what it should be
                            const balanceRaw = BigInt(parsedData.player.data.balance);
                            const balanceUSDT = Number(balanceRaw).toFixed(2); // No division, use raw value
                            currentBalance = balanceUSDT;
                            setUserBalance(balanceUSDT);
                            console.log('LaunchpadContext: Raw balance:', balanceRaw);
                            console.log('LaunchpadContext: Display balance:', balanceUSDT, 'USDT');
                        } else {
                            console.log('LaunchpadContext: No player balance found in RPC response');
                            setUserBalance("0.00");
                        }
                        
                        // Extract global counter for project status calculation
                        if (parsedData.state && parsedData.state.counter) {
                            globalCounter = parsedData.state.counter;
                            setGlobalCounter(globalCounter);
                            console.log('LaunchpadContext: Global counter:', globalCounter);
                        }
                        
                        // Log global state information
                        if (parsedData.state) {
                            console.log('LaunchpadContext: Global state:', {
                                counter: parsedData.state.counter,
                                totalPlayers: parsedData.state.total_players,
                                totalProjects: parsedData.state.total_projects
                            });
                        }
                    } else {
                        console.log('LaunchpadContext: Invalid RPC response structure');
                        setUserBalance("0.00");
                    }
                } catch (balanceError) {
                    console.warn('LaunchpadContext: Failed to query balance via RPC:', balanceError);
                    setUserBalance("0.00");
                }
            } else {
                // For fallback mode, try to get global counter from RPC with fallback key
                try {
                    console.log('LaunchpadContext: Querying global state via RPC with fallback key...');
                    const fallbackPrivkey = "000000";
                    const rpcResponse: any = await api.rpc.queryState(fallbackPrivkey);
                    console.log('LaunchpadContext: Fallback RPC response:', rpcResponse);
                    
                    if (rpcResponse && rpcResponse.success && rpcResponse.data) {
                        const parsedData = JSON.parse(rpcResponse.data);
                        console.log('LaunchpadContext: Parsed fallback RPC data:', parsedData);
                        
                        // Extract global counter for project status calculation
                        if (parsedData.state && parsedData.state.counter) {
                            globalCounter = parsedData.state.counter;
                            setGlobalCounter(globalCounter);
                            console.log('LaunchpadContext: Global counter from fallback:', globalCounter);
                        }
                        
                        // Log global state information
                        if (parsedData.state) {
                            console.log('LaunchpadContext: Global state from fallback:', {
                                counter: parsedData.state.counter,
                                totalPlayers: parsedData.state.total_players,
                                totalProjects: parsedData.state.total_projects
                            });
                        }
                    }
                } catch (fallbackError) {
                    console.warn('LaunchpadContext: Failed to query global state via fallback RPC:', fallbackError);
                }
                setUserBalance("0.00");
            }

            // Fetch all projects (always available)
            console.log('LaunchpadContext: Calling api.getAllProjects()...');
            const allProjects = await api.getAllProjects();
            console.log('LaunchpadContext: Received projects:', allProjects);
            
            // Update project status based on global counter
            const projectsWithUpdatedStatus = allProjects.map(project => {
                let status: 'PENDING' | 'ACTIVE' | 'ENDED';
                const startTime = parseInt(project.startTime);
                const endTime = parseInt(project.endTime);
                
                if (globalCounter < startTime) {
                    status = 'PENDING';
                } else if (globalCounter < endTime) {
                    status = 'ACTIVE';
                } else {
                    status = 'ENDED';
                }
                
                console.log(`LaunchpadContext: Project ${project.projectId} status calculation:`, {
                    globalCounter,
                    startTime,
                    endTime,
                    status
                });
                
                return {
                    ...project,
                    status
                };
            });
            
            setProjects(projectsWithUpdatedStatus);

            // Only fetch user data if player is fully connected
            if (playerId && isConnected && l2Account) {
                console.log('LaunchpadContext: Fetching user data for playerId:', playerId);
                const [pid1, pid2] = playerId;
                
                try {
                    const [positions, stats, history] = await Promise.all([
                        api.getUserAllPositions(pid1, pid2),
                        api.getUserStats(pid1, pid2),
                        api.getUserTransactionHistory(pid1, pid2)
                    ]);

                    setUserPositions(positions);
                    
                    // Update stats with real balance from RPC
                    if (stats) {
                        const updatedStats = {
                            ...stats,
                            balance: currentBalance // Use current balance from this refresh
                        };
                        setUserStats(updatedStats);
                    } else {
                        // Create stats with balance if none exist
                        setUserStats({
                            balance: currentBalance,
                            totalInvested: "0",
                            totalTokens: "0", 
                            totalProjects: "0",
                            portfolioValue: "0",
                            unrealizedGains: "0"
                        });
                    }
                    
                    setTransactionHistory(history);
                    console.log('LaunchpadContext: User data refresh completed successfully');
                } catch (userDataError) {
                    console.warn('LaunchpadContext: Failed to fetch user data (user may not have any data yet):', userDataError);
                    // Set empty defaults for user data but keep the balance
                    setUserPositions([]);
                    setUserStats({
                        balance: currentBalance,
                        totalInvested: "0",
                        totalTokens: "0",
                        totalProjects: "0", 
                        portfolioValue: "0",
                        unrealizedGains: "0"
                    });
                    setTransactionHistory([]);
                }
            } else {
                console.log('LaunchpadContext: Skipping user data fetch - user not fully connected');
                // Reset user data when not connected but keep the balance if available
                setUserPositions([]);
                if (currentBalance !== "0.00") {
                    setUserStats({
                        balance: currentBalance,
                        totalInvested: "0",
                        totalTokens: "0",
                        totalProjects: "0",
                        portfolioValue: "0", 
                        unrealizedGains: "0"
                    });
                } else {
                    setUserStats(null);
                }
                setTransactionHistory([]);
            }

            console.log('LaunchpadContext: Data refresh completed successfully');
        } catch (err) {
            console.error('LaunchpadContext: Failed to refresh data:', err);
            if (isInitialLoad) {
                setError(err instanceof Error ? err.message : 'Failed to refresh data');
            }
        }
    }, [api, playerId, isConnected, l2Account]); // Removed userBalance from dependencies

    // Disconnect and cleanup
    const disconnect = useCallback(() => {
        setApi(null);
        setProjects([]);
        setUserPositions([]);
        setUserStats(null);
        setTransactionHistory([]);
        setError(null);
        setPlayerInstalled(false);
    }, []);

    // Invest in project
    const investInProject = useCallback(async (projectId: string, amount: string) => {
        if (!api) {
            throw new Error('API not available');
        }
        if (!isConnected || fallbackInitialized) {
            throw new Error('Wallet not connected or using fallback mode');
        }

        try {
            setTransactionState({ status: 'PENDING', type: 'INVEST' });
            
            const projectIdBigInt = BigInt(projectId);
            const amountBigInt = BigInt(parseFloat(amount)); // Removed * 1e6, use raw amount
            
            const result = await api.investInProject(projectIdBigInt, amountBigInt);
            
            setTransactionState({ status: 'SUCCESS', type: 'INVEST' });
            
            // Refresh data after successful investment
            await refreshData();
            
            return result;
        } catch (error) {
            setTransactionState({ status: 'ERROR', type: 'INVEST', error: error instanceof Error ? error.message : 'Investment failed' });
            throw error;
        }
    }, [api, isConnected, fallbackInitialized, refreshData]);

    // Withdraw tokens
    const withdrawTokens = useCallback(async (projectId: string) => {
        if (!api) {
            throw new Error('API not available');
        }
        if (!isConnected || fallbackInitialized) {
            throw new Error('Wallet not connected or using fallback mode');
        }

        try {
            setTransactionState({ status: 'PENDING', type: 'WITHDRAW_TOKENS' });
            
            const projectIdBigInt = BigInt(projectId);
            const result = await api.withdrawTokens(projectIdBigInt);
            
            setTransactionState({ status: 'SUCCESS', type: 'WITHDRAW_TOKENS' });
            
            // Refresh data after successful withdrawal
            await refreshData();
            
            return result;
        } catch (error) {
            setTransactionState({ status: 'ERROR', type: 'WITHDRAW_TOKENS', error: error instanceof Error ? error.message : 'Token withdrawal failed' });
            throw error;
        }
    }, [api, isConnected, fallbackInitialized, refreshData]);

    // Withdraw USDT  
    const withdrawUsdt = useCallback(async (amount: string, address: string) => {
        if (!api) {
            throw new Error('API not available');
        }
        if (!isConnected || fallbackInitialized) {
            throw new Error('Wallet not connected or using fallback mode');
        }

        try {
            setTransactionState({ status: 'PENDING', type: 'WITHDRAW_USDT' });
            
            const amountBigInt = BigInt(parseFloat(amount)); // Removed * 1e6, use raw amount
            
            // Parse address into high and low parts (simplified)
            const addressBigInt = BigInt(address);
            const addressHigh = addressBigInt >> 128n;
            const addressLow = addressBigInt & ((1n << 128n) - 1n);
            
            const result = await api.withdrawUsdt(amountBigInt, addressHigh, addressLow);
            
            setTransactionState({ status: 'SUCCESS', type: 'WITHDRAW_USDT' });
            
            // Refresh data after successful withdrawal
            await refreshData();
            
            return result;
        } catch (error) {
            setTransactionState({ status: 'ERROR', type: 'WITHDRAW_USDT', error: error instanceof Error ? error.message : 'USDT withdrawal failed' });
            throw error;
        }
    }, [api, isConnected, fallbackInitialized, refreshData]);

    const value: LaunchpadContextType = {
        api,
        isConnected: isConnected && !!l2Account && !!api && !fallbackInitialized,
        walletInfo: l1Account ? {
            address: l1Account.ethAddress,
            isConnected: !!l1Account,
            balance: "0", // Would need to fetch actual balance
            pid: playerId || ["", ""]
        } : null,
        projects,
        userPositions,
        userStats,
        transactionHistory,
        globalCounter,
        loading,
        error,
        transactionState,
        connect: initializeAPI,
        disconnect,
        refreshData: () => Promise.resolve(refreshData(true)),
        investInProject,
        withdrawTokens,
        withdrawUsdt
    };

    return (
        <LaunchpadContext.Provider value={value}>
            {children}
        </LaunchpadContext.Provider>
    );
};

// Hook to use launchpad context
export const useLaunchpad = (): LaunchpadContextType => {
    const context = useContext(LaunchpadContext);
    if (context === undefined) {
        throw new Error('useLaunchpad must be used within a LaunchpadProvider');
    }
    return context;
};

// Specific hooks for different functionality
export const useProjects = () => {
    const { projects, loading, error } = useLaunchpad();
    return { projects, loading, error };
};

export const useUserPortfolio = () => {
    const { userPositions, userStats, transactionHistory, loading, refreshData } = useLaunchpad();
    return { 
        positions: userPositions, 
        stats: userStats, 
        transactionHistory, 
        loading, 
        refetch: refreshData 
    };
};

export const useInvestment = () => {
    const { investInProject, withdrawTokens, withdrawUsdt, transactionState } = useLaunchpad();
    return { 
        invest: investInProject, 
        withdraw: withdrawTokens, 
        withdrawUsdt, 
        transaction: transactionState 
    };
};

export default LaunchpadContext; 