#!/bin/bash

# Tradely DeFi Portfolio Management - Deployment Script
# This script helps you deploy the application to various platforms

echo "🛡️  Tradely DeFi Portfolio Management - Deployment Helper"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to deploy to Vercel
deploy_vercel() {
    echo "🚀 Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo "📦 Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Build the project
    echo "🏗️  Building the project..."
    npm run build
    
    # Deploy
    echo "🚀 Deploying to Vercel..."
    vercel --prod
    
    echo "✅ Deployment complete!"
}

# Function to deploy with Docker
deploy_docker() {
    echo "🐳 Building Docker image..."
    
    # Create Dockerfile if it doesn't exist
    if [ ! -f "Dockerfile" ]; then
        cat > Dockerfile << EOF
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
EOF
        echo "📝 Created Dockerfile"
    fi
    
    # Build Docker image
    docker build -t tradely-defi .
    
    echo "✅ Docker image built successfully!"
    echo "🚀 To run the container: docker run -p 3000:3000 tradely-defi"
}

# Function to create a production build
build_production() {
    echo "🏗️  Creating production build..."
    
    # Install dependencies
    npm install
    
    # Build the project
    npm run build
    
    echo "✅ Production build complete!"
    echo "🚀 To start the production server: npm start"
}

# Show menu
echo ""
echo "Choose deployment option:"
echo "1) Build for production"
echo "2) Deploy to Vercel"
echo "3) Build Docker image"
echo "4) Exit"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        build_production
        ;;
    2)
        deploy_vercel
        ;;
    3)
        deploy_docker
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🎉 Done! Your Tradely DeFi Portfolio Management app is ready!"
echo ""
echo "📝 Don't forget to:"
echo "   • Set up your WalletConnect Project ID in .env.local"
echo "   • Configure your RPC providers"
echo "   • Set up your domain for production deployment"
echo ""
echo "🛡️  Happy DeFi trading!"
