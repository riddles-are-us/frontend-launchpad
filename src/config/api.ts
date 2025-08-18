// API Configuration for zkWasm Launchpad

export const API_CONFIG = {
  // zkWasm Server Configuration
  serverUrl: import.meta.env.REACT_APP_URL || "http://localhost:3000",
  
  // User private key (in production this should come from wallet connection)
  privateKey: import.meta.env.REACT_APP_USER_PRIVATE_KEY || "0x1234567890abcdef",
  
  // Network configuration
  network: import.meta.env.REACT_APP_NETWORK || "testnet",
  
  // Debug mode
  debug: import.meta.env.REACT_APP_DEBUG === "true",
  
  // Default values
  defaults: {
    // Default investment amount (matching backend config.rs)
    minInvestmentAmount: "100000", // 100K points = 1 USDT (MIN_INVESTMENT_AMOUNT)
    maxInvestmentAmount: "300000000", // 300M points = 3K USDT (MAX_INDIVIDUAL_CAP)
    
    // Pagination
    projectsPerPage: 12,
    transactionsPerPage: 20,
    
    // Refresh intervals (in milliseconds)
    dataRefreshInterval: 30000, // 30 seconds
    transactionPollInterval: 5000, // 5 seconds
  }
};

// Validation functions
export const validateConfig = () => {
  const requiredVars = ['serverUrl'];
  const missing = requiredVars.filter(key => !API_CONFIG[key as keyof typeof API_CONFIG]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
};

// Helper to get configuration with validation
export const getConfig = () => {
  validateConfig();
  return API_CONFIG;
};

export default API_CONFIG; 