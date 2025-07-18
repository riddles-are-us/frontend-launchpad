import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t-2 border-border bg-background mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="text-xl font-bold text-gradient-primary">zkCross</div>
              <div className="text-lg font-mono text-accent">Launchpad</div>
            </div>
            <p className="font-mono text-sm text-muted-foreground">
              The ultimate IDO launchpad for Web3 Applications powered by zkCross technology
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="font-mono font-semibold text-primary uppercase tracking-wider">Platform</h3>
            <div className="flex flex-col space-y-2">
              <Link to="/" className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/projects" className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors">
                Browse Projects
              </Link>
              <Link to="/dashboard" className="font-mono text-sm text-muted-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
            </div>
          </div>

          {/* Resources - Temporarily commented out */}
          {/* <div className="space-y-4">
            <h3 className="font-mono font-semibold text-secondary uppercase tracking-wider">Resources</h3>
            <div className="flex flex-col space-y-2">
              <a href="#" className="font-mono text-sm text-muted-foreground hover:text-secondary transition-colors">
                Documentation
              </a>
              <a href="#" className="font-mono text-sm text-muted-foreground hover:text-secondary transition-colors">
                API Reference
              </a>
              <a href="#" className="font-mono text-sm text-muted-foreground hover:text-secondary transition-colors">
                Support
              </a>
            </div>
          </div> */}

          {/* Community */}
          <div className="space-y-4">
            <h3 className="font-mono font-semibold text-accent uppercase tracking-wider">Community</h3>
            <div className="flex flex-col space-y-2">
              <a 
                href="https://discord.com/invite/EhFMmF7S7b" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-mono text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                💬 Discord
              </a>
              <a 
                href="https://x.com/DelphinusLab" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-mono text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                🐦 Twitter
              </a>
              <a 
                href="https://t.me/DelphinusLabOfficial" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-mono text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                📨 Telegram
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="font-mono text-sm text-muted-foreground">
            © 2024 zkCross Launchpad. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pixel-pulse"></div>
              <span className="font-mono text-xs text-success">TESTNET</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;