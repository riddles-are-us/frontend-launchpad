# Launchpad Frontend

A modern IDO (Initial DEX Offering) launchpad platform built with React, TypeScript, and integrated with zkWasm-minirollup backend.

## Features

- 🚀 **Project Discovery**: Browse and filter active, pending, and ended IDO projects
- 💰 **Investment Management**: Invest in projects with real-time validation
- 📊 **Portfolio Tracking**: Monitor your investments and token allocations  
- 🔄 **Token Withdrawal**: Withdraw allocated tokens after project completion
- 📈 **Real-time Data**: Live project statistics and progress tracking
- 🎨 **Modern UI**: Beautiful pixel-art inspired design with smooth animations

## API Integration

This project integrates with the zkwasm-launchpad backend API to provide:

### Core Functionality
- **Player Management**: Automatic player registration and management
- **Investment Operations**: Secure investment transactions via zkWasm rollup
- **Token Operations**: Token withdrawal and allocation management
- **Data Queries**: Real-time project and user data retrieval

### API Services

#### LaunchpadAPI Class
Located in `src/services/api.ts`, provides:

- `getAllProjects()` - Get all IDO projects
- `getProject(id)` - Get specific project details
- `getUserAllPositions(pid1, pid2)` - Get user's portfolio positions
- `getUserStats(pid1, pid2)` - Get user statistics and balances
- `investInProject(projectId, amount)` - Invest in a project
- `withdrawTokens(projectId)` - Withdraw allocated tokens
- `withdrawPoints(amount, address)` - Withdraw ZKWASM Points to external address

#### Context Provider
`src/contexts/LaunchpadContext.tsx` provides:

- Global state management for API connection
- React hooks for data fetching: `useProjects()`, `useUserPortfolio()`, `useInvestment()`
- Automatic data refreshing and error handling
- Transaction state management

### Data Types

Key TypeScript interfaces in `src/types/launchpad.ts`:

```typescript
interface IdoProjectData {
  projectId: string;
  tokenSymbol: string;
  targetAmount: string;
  totalRaised: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'ACTIVE' | 'ENDED';
  progress: number;
  isOverSubscribed: boolean;
}

interface UserProjectPosition {
  projectId: string;
  investedAmount: string;
  tokensWithdrawn: boolean;
  canWithdraw: boolean;
  status: string;
}
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# zkWasm Server Configuration
REACT_APP_ZKWASM_SERVER_URL=http://localhost:3000

# User Private Key (should come from wallet in production)
REACT_APP_USER_PRIVATE_KEY=0x1234567890abcdef

# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3000
REACT_APP_NETWORK=testnet
REACT_APP_DEBUG=true
```

### API Configuration

Configuration is managed in `src/config/api.ts`:

```typescript
export const API_CONFIG = {
  serverUrl: process.env.REACT_APP_ZKWASM_SERVER_URL || "http://localhost:3000",
  privateKey: process.env.REACT_APP_USER_PRIVATE_KEY || "0x1234567890abcdef",
  // ... other config options
};
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or bun package manager
- Running zkwasm-launchpad backend server

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd frontend-launchpad
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
# or 
bun dev
```

5. Open http://localhost:8080 in your browser

### Backend Setup

Ensure the zkwasm-launchpad backend is running:

```bash
cd ../zkwasm-launchpad
# Follow backend setup instructions
npm start # or equivalent command
```

## Project Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── ProjectCard.tsx # IDO project display card
│   │   └── StatCard.tsx    # Statistics display card
│   └── layout/             # Layout components
├── contexts/
│   └── LaunchpadContext.tsx # Global state management
├── services/
│   └── api.ts              # API integration layer
├── types/
│   └── launchpad.ts        # TypeScript type definitions
├── config/
│   └── api.ts              # Configuration management
├── pages/
│   ├── Dashboard.tsx       # User portfolio dashboard
│   ├── Projects.tsx        # Project discovery page
│   └── Index.tsx           # Landing page
└── hooks/                  # Custom React hooks
```

## Usage Examples

### Using the API Hooks

```typescript
import { useProjects, useInvestment } from '@/contexts/LaunchpadContext';

function ProjectsList() {
  const { projects, loading, error } = useProjects();
  const { invest, transaction } = useInvestment();

  const handleInvest = async (projectId: string, amount: string) => {
    try {
      await invest(projectId, amount);
      console.log('Investment successful!');
    } catch (error) {
      console.error('Investment failed:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {projects.map(project => (
        <ProjectCard 
          key={project.projectId}
          project={project}
          onInvest={handleInvest}
        />
      ))}
    </div>
  );
}
```
## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support:
- Check the [zkwasm-launchpad backend documentation](../zkwasm-launchpad/README.md)
- Review the API integration examples above
- Submit issues via GitHub Issues 