# 🚀 Guardian DeFi - Deployment Guide

This guide will walk you through deploying Guardian DeFi Portfolio Management to Vercel with automated CI/CD.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **GitHub Repository**: Your code pushed to a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **API Keys**: Required third-party service API keys
4. **Domain** (Optional): Custom domain for production

## 🔑 Required Environment Variables

### WalletConnect (Required)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Get from [WalletConnect Cloud](https://cloud.walletconnect.com)

### Blockchain RPC Providers (Optional but Recommended)
- `NEXT_PUBLIC_ALCHEMY_API_KEY`: Get from [Alchemy](https://www.alchemy.com)
- `NEXT_PUBLIC_ETHEREUM_RPC_URL`: Ethereum RPC endpoint
- `NEXT_PUBLIC_POLYGON_RPC_URL`: Polygon RPC endpoint  
- `NEXT_PUBLIC_ARBITRUM_RPC_URL`: Arbitrum RPC endpoint

### Market Data (Optional)
- `NEXT_PUBLIC_COINAPI_KEY`: Get from [CoinAPI](https://www.coinapi.io)

## 🚀 Quick Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/guardian-defi&env=NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID&envDescription=WalletConnect%20Project%20ID%20required%20for%20wallet%20connectivity&envLink=https://cloud.walletconnect.com)

### Option 2: Manual Deployment

1. **Connect to Vercel**
   ```bash
   npx vercel --prod
   ```

2. **Follow the prompts**:
   - Link to existing project or create new
   - Set up build settings (auto-detected)
   - Configure environment variables

## 🔧 Automated Deployment Setup

### Step 1: GitHub Secrets Configuration

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

#### Required Secrets
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_organization_id  
VERCEL_PROJECT_ID=your_project_id
```

#### Optional Secrets (for environment variables)
```
WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
ALCHEMY_API_KEY=your_alchemy_api_key
ETHEREUM_RPC_URL=your_ethereum_rpc_url
POLYGON_RPC_URL=your_polygon_rpc_url
ARBITRUM_RPC_URL=your_arbitrum_rpc_url
COINAPI_KEY=your_coinapi_key
```

### Step 2: Get Vercel Configuration

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link your project**:
   ```bash
   vercel link
   ```

4. **Get your Organization and Project IDs**:
   ```bash
   # This will show your org ID and project ID
   cat .vercel/project.json
   ```

5. **Generate Vercel Token**:
   - Go to [Vercel Settings > Tokens](https://vercel.com/account/tokens)
   - Create a new token
   - Copy and add to GitHub secrets

### Step 3: Environment Variables in Vercel

Add your environment variables in Vercel dashboard:

1. Go to your project in Vercel
2. Navigate to `Settings > Environment Variables`
3. Add all required variables for each environment:
   - **Development**
   - **Preview** 
   - **Production**

## 🔄 CI/CD Pipeline Features

Our simplified GitHub Actions workflow provides:

### 🔍 **Code Quality Checks**
- TypeScript type checking
- ESLint linting
- Build verification

### 🚀 **Streamlined Deployment**
- **Pull Requests**: Automatic preview deployments
- **Main Branch**: Automatic production deployments
- **Single Job**: Build and deploy in one streamlined process
- **Conditional Logic**: Smart deployment based on event type

### 📊 **Simple Monitoring**
- Deployment status in GitHub
- Vercel dashboard monitoring
- Health check endpoints

## 🌐 Custom Domain Setup

### Step 1: Add Domain in Vercel
1. Go to your project settings
2. Navigate to `Domains`
3. Add your custom domain

### Step 2: DNS Configuration
Point your domain to Vercel:
- **A Record**: `76.76.19.61`
- **CNAME**: `alias.vercel-dns.com` (for subdomains)

### Step 3: SSL Certificate
Vercel automatically provisions SSL certificates for all domains.

## 🔧 Advanced Configuration

### Performance Optimization
```json
// vercel.json
{
  "regions": ["iad1", "sfo1", "lhr1"],
  "functions": {
    "app/**/*.{js,ts,tsx}": {
      "maxDuration": 30
    }
  }
}
```

### Security Headers
Our deployment includes security headers:
- Content Security Policy
- XSS Protection
- Frame Options
- HSTS

### Caching Strategy
- Static assets: 1 year cache
- API responses: Configurable cache
- Pages: ISR with revalidation

## 📊 Monitoring & Analytics

### Built-in Monitoring
- Vercel Analytics (automatic)
- Performance monitoring
- Error tracking
- Core Web Vitals

### Health Checks
- Endpoint: `/api/health`
- Monitors: Memory, uptime, external APIs
- Status codes: 200 (healthy), 503 (unhealthy)

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build locally
npm run build

# Check types
npm run type-check
```

#### Environment Variables
```bash
# Verify env vars are set
vercel env ls

# Pull env to local
vercel env pull .env.local
```

#### Domain Issues
- Verify DNS settings
- Check SSL certificate status
- Ensure domain is added to Vercel project

### Debug Deployments
```bash
# View deployment logs
vercel logs [deployment-url]

# Inspect deployment
vercel inspect [deployment-url]
```

## 🚦 Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] WalletConnect project ID set up
- [ ] Custom domain configured (if applicable)
- [ ] Security headers reviewed
- [ ] Performance optimization enabled
- [ ] Monitoring set up
- [ ] Health checks working
- [ ] SSL certificate active
- [ ] DNS propagated
- [ ] Error boundaries tested
- [ ] Mobile responsiveness verified

## 📝 Deployment Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linting
npm run type-check   # Type checking
```

### Vercel CLI
```bash
vercel                # Deploy to preview
vercel --prod        # Deploy to production
vercel domains       # Manage domains
vercel env           # Manage environment variables
vercel logs          # View deployment logs
```

## 🌟 Best Practices

1. **Environment Separation**: Use different API keys for development/production
2. **Security**: Never commit sensitive data to Git
3. **Performance**: Optimize images and bundles
4. **Monitoring**: Set up alerts for critical failures
5. **Backups**: Regular backups of configuration
6. **Testing**: Test deployments in preview before production

## 🆘 Support

If you encounter issues:

1. Check the [Vercel Documentation](https://vercel.com/docs)
2. Review GitHub Actions logs
3. Check Vercel deployment logs
4. Contact support through the repository issues

---

🛡️ **Guardian DeFi Portfolio Management** - Secure, Fast, Reliable
