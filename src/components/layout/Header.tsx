import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { useConnectModal } from "zkwasm-minirollup-browser";
import { Wallet } from "lucide-react";

const Header = () => {
  const location = useLocation();
  const walletContext = useWallet();
  const { isConnected, isL2Connected, l1Account, l2Account, connectL2 } = walletContext;
  const { openConnectModal } = useConnectModal();

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address || typeof address !== 'string') {
      return 'Invalid Address';
    }
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Handle wallet connection
  const handleWalletClick = async () => {
    try {
      if (!isConnected) {
        // 如果L1未连接，打开连接模态框
        console.log('Opening wallet connect modal...');
        openConnectModal?.();
      } else if (!isL2Connected) {
        // 如果L1已连接但L2未连接，连接L2
        console.log('Connecting L2 account...');
        await connectL2();
      } else {
        // 已经完全连接
        console.log('Wallet already fully connected');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <header className="border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="text-2xl font-bold text-gradient-primary animate-glow">
              zkCross
            </div>
            <div className="text-xl font-mono text-accent">Launchpad</div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`font-mono text-sm uppercase tracking-wider transition-colors ${
                location.pathname === '/' ? 'text-primary' : 'text-foreground hover:text-primary'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/projects" 
              className={`font-mono text-sm uppercase tracking-wider transition-colors ${
                location.pathname === '/projects' ? 'text-primary' : 'text-foreground hover:text-primary'
              }`}
            >
              Projects
            </Link>
            <Link 
              to="/dashboard" 
              className={`font-mono text-sm uppercase tracking-wider transition-colors ${
                location.pathname === '/dashboard' ? 'text-primary' : 'text-foreground hover:text-primary'
              }`}
            >
              Dashboard
            </Link>

          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isConnected && l1Account && l1Account.address && (
              <div className="hidden lg:flex items-center space-x-2">
                <Badge variant="default" className="font-mono text-xs">
                  {formatAddress(l1Account.address)}
                </Badge>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleWalletClick}
              className={`btn-pixel font-mono text-xs sm:text-sm px-2 sm:px-4 ${
                isConnected && isL2Connected
                  ? 'border-success text-success hover:bg-success hover:text-success-foreground' 
                  : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{isConnected && isL2Connected ? 'CONNECTED' : 'CONNECT LAUNCHPAD'}</span>
              <span className="sm:hidden">{isConnected && isL2Connected ? 'CONNECTED' : 'CONNECT'}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;