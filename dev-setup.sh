#!/bin/bash

# Tradely DeFi Portfolio Management - Development Helper
# This script helps you set up and run the development environment

echo "🛡️  Tradely DeFi Portfolio Management - Development Setup"
echo "========================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Function to setup the project
setup_project() {
    echo "📦 Setting up the project..."
    
    # Install dependencies
    echo "📥 Installing dependencies..."
    npm install
    
    # Create environment file if it doesn't exist
    if [ ! -f ".env.local" ]; then
        echo "📝 Creating .env.local file..."
        cp .env.example .env.local
        echo "⚠️  Please update .env.local with your actual API keys!"
    fi
    
    echo "✅ Project setup complete!"
}

# Function to start development server
start_dev() {
    echo "🚀 Starting development server..."
    npm run dev
}

# Function to run linting
run_lint() {
    echo "🔍 Running ESLint..."
    npm run lint
}

# Function to run build
run_build() {
    echo "🏗️  Building the project..."
    npm run build
}

# Function to check project status
check_status() {
    echo "📊 Project Status"
    echo "=================="
    
    echo "📦 Dependencies:"
    if [ -d "node_modules" ]; then
        echo "   ✅ node_modules exists"
    else
        echo "   ❌ node_modules not found - run 'npm install'"
    fi
    
    echo "🔑 Environment:"
    if [ -f ".env.local" ]; then
        echo "   ✅ .env.local exists"
    else
        echo "   ⚠️  .env.local not found - copy from .env.example"
    fi
    
    echo "🔧 Configuration:"
    if [ -f "next.config.ts" ]; then
        echo "   ✅ next.config.ts configured"
    fi
    
    if [ -f "tailwind.config.ts" ]; then
        echo "   ✅ tailwind.config.ts configured"
    fi
    
    echo "📝 Package info:"
    echo "   Node.js: $(node -v)"
    echo "   npm: $(npm -v)"
    
    # Check if development server is running
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        echo "   🟢 Development server running on port 3000"
    elif lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
        echo "   🟢 Development server running on port 3001"
    else
        echo "   ⚪ Development server not running"
    fi
}

# Show menu
echo ""
echo "Choose an option:"
echo "1) Setup project (install dependencies)"
echo "2) Start development server"
echo "3) Run build"
echo "4) Run linter"
echo "5) Check project status"
echo "6) Exit"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        setup_project
        ;;
    2)
        start_dev
        ;;
    3)
        run_build
        ;;
    4)
        run_lint
        ;;
    5)
        check_status
        ;;
    6)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🎉 Done!"
echo ""
echo "📝 Next steps:"
echo "   • Visit http://localhost:3000 (or 3001) to see your app"
echo "   • Update .env.local with your WalletConnect Project ID"
echo "   • Start building your DeFi portfolio!"
echo ""
echo "🛡️  Happy coding!"
