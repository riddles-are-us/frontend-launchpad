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

const LaunchpadContext = createContext<LaunchpadContextType | undefined>(undefined);

export const LaunchpadProvider: React.FC<LaunchpadProviderProps> = ({ children, config }) => {
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

    // Use wallet context from zkWasm SDK
    const walletData = useWallet();
    const { l1Account, l2Account, playerId, setPlayerId, isConnected } = walletData;

    // Initialize API when L2 account is available
    useEffect(() => {
        if (l2Account && l2Account.getPrivateKey && !api && !apiInitializing) {
            initializeAPI();
        }
    }, [l2Account, api, apiInitializing]);

    // Reset all state when wallet is disconnected
    useEffect(() => {
        if (!l1Account && !l2Account) {
            setProjects([]);
            setUserPositions([]);
            setUserStats(null);
            setTransactionHistory([]);
            setApi(null);
            setPlayerInstalled(false);
            setApiInitializing(false);
            setLoading(false);
            setError(null);
        }
    }, [l1Account, l2Account]);

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

    // Set up polling when API is ready and player is installed
    useEffect(() => {
        if (api && playerInstalled && playerId) {
            console.log("Player installed, starting data polling...");
            
            // Load initial data
            loadInitialData();
            
            // Set up polling interval (every 5 seconds)
            const pollInterval = setInterval(() => {
                refreshData(false); // false = automatic refresh
            }, 5000);

            return () => {
                clearInterval(pollInterval);
            };
        }
    }, [api, playerInstalled, playerId]);

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

            // Fetch all projects (always available)
            console.log('LaunchpadContext: Calling api.getAllProjects()...');
            const allProjects = await api.getAllProjects();
            console.log('LaunchpadContext: Received projects:', allProjects);
            setProjects(allProjects);

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
                    setUserStats(stats);
                    setTransactionHistory(history);
                    console.log('LaunchpadContext: User data refresh completed successfully');
                } catch (userDataError) {
                    console.warn('LaunchpadContext: Failed to fetch user data (user may not have any data yet):', userDataError);
                    // Set empty defaults for user data
                    setUserPositions([]);
                    setUserStats(null);
                    setTransactionHistory([]);
                }
            } else {
                console.log('LaunchpadContext: Skipping user data fetch - user not fully connected');
                // Reset user data when not connected
                setUserPositions([]);
                setUserStats(null);
                setTransactionHistory([]);
            }

            console.log('LaunchpadContext: Data refresh completed successfully');
        } catch (err) {
            console.error('LaunchpadContext: Failed to refresh data:', err);
            if (isInitialLoad) {
                setError(err instanceof Error ? err.message : 'Failed to refresh data');
            }
        }
    }, [api, playerId, isConnected, l2Account]);

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
        if (!api || !playerId) {
            throw new Error('API not available or player not installed');
        }

        try {
            setTransactionState({ status: 'PENDING', type: 'INVEST' });
            
            const projectIdBigInt = BigInt(projectId);
            const amountBigInt = BigInt(parseFloat(amount) * 1e6); // Assuming 6 decimals for USDT
            
            const result = await api.investInProject(projectIdBigInt, amountBigInt);
            
            setTransactionState({ status: 'SUCCESS', type: 'INVEST' });
            
            // Refresh data after successful investment
            await refreshData();
            
            return result;
        } catch (error) {
            setTransactionState({ status: 'ERROR', type: 'INVEST', error: error instanceof Error ? error.message : 'Investment failed' });
            throw error;
        }
    }, [api, playerId, refreshData]);

    // Withdraw tokens
    const withdrawTokens = useCallback(async (projectId: string) => {
        if (!api || !playerId) {
            throw new Error('API not available or player not installed');
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
    }, [api, playerId, refreshData]);

    // Withdraw USDT  
    const withdrawUsdt = useCallback(async (amount: string, address: string) => {
        if (!api || !playerId) {
            throw new Error('API not available or player not installed');
        }

        try {
            setTransactionState({ status: 'PENDING', type: 'WITHDRAW_USDT' });
            
            const amountBigInt = BigInt(parseFloat(amount) * 1e6); // Assuming 6 decimals for USDT
            
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
    }, [api, playerId, refreshData]);

    const value: LaunchpadContextType = {
        api,
        isConnected: isConnected && !!l2Account && playerInstalled,
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