# Guardian - Professional DeFi Portfolio Management

🛡️ A comprehensive, professional-grade DeFi portfolio management application built with Next.js, featuring advanced analytics, multi-wallet support, and intelligent trading capabilities.

## ✨ Features

### 🏦 Portfolio Management
- **Real-time Portfolio Tracking** - Monitor your DeFi positions across multiple chains
- **Asset Allocation Visualization** - Interactive charts showing portfolio distribution
- **Performance Analytics** - Historical performance tracking with risk metrics
- **Cross-chain Balance Aggregation** - Unified view of assets across different blockchains

### 📊 Advanced Analytics
- **Performance Dashboard** - Comprehensive performance metrics and trends
- **Risk Assessment** - Detailed risk analysis with VaR, Sharpe ratio, and volatility metrics
- **Asset Analysis** - Deep dive into individual asset performance and correlations
- **Market Intelligence** - Real-time market data with top gainers/losers

### 🤖 AI-Powered Strategies
- **Strategy Builder** - Create custom DeFi strategies with drag-and-drop interface
- **Backtesting Engine** - Test strategies against historical data
- **AI Recommendations** - Machine learning-powered investment suggestions
- **Risk Management** - Automated risk controls and position sizing

### 💱 Advanced Trading
- **Multi-DEX Trading** - Trade across multiple decentralized exchanges
- **Limit Orders** - Set advanced order types with slippage protection
- **MEV Protection** - Built-in protection against maximal extractable value attacks
- **Transaction Batching** - Optimize gas costs with transaction batching
- **Price Impact Analysis** - Real-time price impact calculations
- **Nitrolite Integration** - State channel optimization for up to 95% gas savings

### 🔐 Multi-Wallet Support
- **Multiple Wallet Connectors** - Support for MetaMask, WalletConnect, Coinbase Wallet
- **Chain Switching** - Seamless switching between different blockchain networks
- **Balance Tracking** - Real-time balance updates across all connected wallets
- **Transaction History** - Comprehensive transaction tracking and analysis

### 🎨 Professional UI/UX
- **Dark/Light Theme** - Beautiful themes with smooth transitions
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Real-time Updates** - Live data updates without page refreshes
- **Loading States** - Smooth loading animations and skeleton screens
- **Error Handling** - Comprehensive error boundaries and user feedback

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- A supported Web3 wallet (MetaMask, WalletConnect, etc.)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Guardian
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible UI primitives
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization

### State Management
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management
- **Persist Middleware** - State persistence

### Web3 Integration
- **Wagmi** - React hooks for Ethereum
- **Viem** - TypeScript interface for Ethereum
- **WalletConnect** - Multi-wallet connectivity

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Portfolio dashboard
│   ├── portfolio/         # Portfolio management
│   ├── strategies/        # Strategy builder & backtesting
│   ├── markets/           # Market data & trading
│   ├── analytics/         # Advanced analytics
│   └── layout.tsx         # Root layout with providers
├── components/
│   ├── layout/           # Header, Sidebar, Navigation
│   ├── trading/          # Trading panel components
│   ├── wallet/           # Wallet connection components
│   └── ui/               # Reusable UI components
├── lib/
│   ├── blockchain/       # Blockchain data providers
│   └── utils.ts          # Utility functions
└── store/
    └── index.ts          # Zustand stores
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the root directory:

```env
# WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Alchemy API Key (optional, for enhanced Web3 functionality)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key

# Additional RPC URLs
NEXT_PUBLIC_ETHEREUM_RPC_URL=your_ethereum_rpc
NEXT_PUBLIC_POLYGON_RPC_URL=your_polygon_rpc
NEXT_PUBLIC_ARBITRUM_RPC_URL=your_arbitrum_rpc
```

### Wallet Configuration
The app supports multiple wallets out of the box:
- MetaMask
- WalletConnect
- Coinbase Wallet
- Rainbow Wallet

## 📊 Features Deep Dive

### Dashboard
- Portfolio overview with real-time balances
- Performance charts and metrics
- AI-powered insights and recommendations
- Quick action buttons for common tasks
- Recent transaction history

### Portfolio Management
- Asset allocation pie charts
- Individual token performance cards
- Historical performance tracking
- Risk metrics and analysis
- Export functionality for tax reporting

### Strategy Builder
- Drag-and-drop strategy creation
- Pre-built strategy templates
- Backtesting with historical data
- Risk assessment and optimization
- Strategy comparison tools

### Market Analysis
- Real-time price data
- Top gainers and losers
- Market cap and volume metrics
- Technical indicators
- Integrated trading panel

### Advanced Analytics
- Portfolio performance analysis
- Risk metrics (VaR, Sharpe ratio, volatility)
- Correlation analysis
- Sector allocation
- Yield farming optimization

## 🔒 Security Features

- **Non-custodial** - Your keys, your crypto
- **MEV Protection** - Built-in frontrunning protection
- **Slippage Protection** - Automatic slippage controls
- **Transaction Simulation** - Preview transactions before execution
- **Error Boundaries** - Comprehensive error handling

## 🚀 Deployment

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/guardian-defi&env=NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID&envDescription=WalletConnect%20Project%20ID%20required%20for%20wallet%20connectivity&envLink=https://cloud.walletconnect.com)

### Manual Deployment

#### Vercel (Recommended)
```bash
npm install -g vercel
npm run build
vercel --prod
```

#### Docker
```bash
docker build -t guardian-defi .
docker run -p 3000:3000 guardian-defi
```

#### Self-hosted
```bash
npm run build
npm start
```

### Automated CI/CD

This project includes GitHub Actions for automated deployment:

- **Pull Requests**: Automatic preview deployments
- **Main Branch**: Automatic production deployments  
- **Quality Checks**: Linting, type checking, security scans
- **Performance Monitoring**: Bundle size, Core Web Vitals

**Setup Instructions**:
1. Add GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
2. Configure environment variables in Vercel dashboard
3. Push to main branch for automatic deployment

📖 **Full deployment guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Radix UI for accessible components
- Wagmi for Web3 React hooks
- The entire DeFi community for inspiration

## 📞 Support

For support, email support@guardian-defi.com or join our Discord community.

---

Built with ❤️ by the Guardian team
