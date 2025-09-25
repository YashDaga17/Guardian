'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Settings, 
  X,
  ChevronLeft,
  ChevronRight,
  Brain,
  Eye,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/store';
import { PortfolioContextService } from '@/lib/ai/portfolioContext';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Portfolio overview',
  },
  {
    name: 'Portfolio',
    href: '/portfolio',
    icon: Briefcase,
    description: 'Asset management',
  },
  {
    name: 'Strategies',
    href: '/strategies',
    icon: Target,
    description: 'AI-powered strategies',
    badge: 'AI',
  },
  {
    name: 'Markets',
    href: '/markets',
    icon: TrendingUp,
    description: 'Market data & trading',
  },
  {
    name: 'Market Intelligence',
    href: '/market-intelligence',
    icon: Eye,
    description: 'Multi-asset watchlists & alerts',
    badge: 'NEW',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Performance insights',
  },
  {
    name: 'AI Analytics',
    href: '/ai-analytics',
    icon: Brain,
    description: 'AI-powered insights',
    badge: 'AI',
  },
  {
    name: 'Yellow Network',
    href: '/yellow-network',
    icon: Zap,
    description: 'Nitrolite state channels',
    badge: 'TESTNET',
  },
];

const bottomNavigation = [
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Preferences & config',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, isMobile } = useUIStore();
  const [collapsed, setCollapsed] = useState(false);
  const [portfolioData, setPortfolioData] = useState<{
    totalValue: number;
    changePercent: number;
  } | null>(null);

  // Load real portfolio data
  useEffect(() => {
    const loadPortfolioData = async () => {
      try {
        const portfolio = await PortfolioContextService.getPortfolioSummary();
        setPortfolioData({
          totalValue: portfolio.totalValueUSD,
          changePercent: portfolio.totalChangePercent
        });
      } catch (error) {
        console.error('Error loading portfolio data:', error);
      }
    };

    loadPortfolioData();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadPortfolioData, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleLinkClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-background border-r transition-all duration-200 md:relative md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center px-4 border-b">
          {!collapsed && (
            <>
              <div className="flex items-center space-x-2 flex-1">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <span className="font-bold text-lg">Tradely</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  Beta
                </Badge>
              </div>
            </>
          )}
          
          {/* Close button (mobile) */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="ml-auto"
            >
              <X className="h-5 w-5" />
            </Button>
          )}

          {/* Collapse button (desktop) */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className={cn("ml-auto", collapsed && "mx-auto")}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <Badge 
                        variant={isActive ? "secondary" : "outline"} 
                        className="text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
                
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                    {item.name}
                    {item.description && (
                      <div className="text-muted-foreground">{item.description}</div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 space-y-2">
          <Separator />
          
          {/* Portfolio Summary */}
          {!collapsed && (
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <div className="text-xs text-muted-foreground mb-1">Total Portfolio</div>
              {portfolioData ? (
                <>
                  <div className="text-lg font-semibold">
                    ${portfolioData.totalValue.toLocaleString()}
                  </div>
                  <div className={`text-xs ${portfolioData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {portfolioData.changePercent >= 0 ? '+' : ''}{portfolioData.changePercent.toFixed(2)}% (24h)
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg font-semibold">Loading...</div>
                  <div className="text-xs text-muted-foreground">Fetching prices</div>
                </>
              )}
            </div>
          )}

          {/* Bottom Navigation */}
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="flex-1">{item.name}</span>}
                
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                    {item.name}
                    {item.description && (
                      <div className="text-muted-foreground">{item.description}</div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
