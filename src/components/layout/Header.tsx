import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isConnected, setIsConnected] = useState(false);
  const location = useLocation();

  const handleConnectWallet = () => {
    setIsConnected(!isConnected);
  };

  return (
    <header className="border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-gradient-primary animate-glow">
              zkWASM
            </div>
            <div className="text-xl font-mono text-accent">IDO</div>
          </div>

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
          <div className="flex items-center space-x-4">
            {isConnected && (
              <div className="hidden md:flex items-center space-x-2 px-3 py-1 border border-primary/30 bg-primary/10">
                <div className="w-2 h-2 rounded-full bg-primary animate-pixel-pulse"></div>
                <span className="font-mono text-xs text-primary">1,250.50 USDT</span>
              </div>
            )}
            
            <Button
              onClick={handleConnectWallet}
              variant="outline"
              className={`btn-pixel font-mono ${
                isConnected 
                  ? 'border-success text-success hover:bg-success hover:text-success-foreground' 
                  : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              {isConnected ? 'CONNECTED' : 'CONNECT WALLET'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;