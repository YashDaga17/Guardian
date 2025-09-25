/**
 * Standardized Card Components for Tradely DeFi Platform
 * Ensures consistent design and border colors across all cards
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Standard card variants with consistent styling
export type CardVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface StandardCardProps {
  variant?: CardVariant;
  className?: string;
  children?: React.ReactNode;
}

interface StandardCardHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

interface StandardCardContentProps {
  children: React.ReactNode;
  className?: string;
}

// Get consistent card styling based on variant
const getCardStyles = (variant: CardVariant): string => {
  switch (variant) {
    case 'success':
      return 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/30';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50/30 dark:border-yellow-800 dark:bg-yellow-950/30';
    case 'error':
      return 'border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/30';
    case 'info':
      return 'border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/30';
    case 'default':
    default:
      return 'border-border bg-background'; // Standard neutral design
  }
};

// Standardized Card Component
export function StandardCard({ variant = 'default', className, children, ...props }: StandardCardProps & React.ComponentProps<typeof Card>) {
  return (
    <Card 
      className={cn(getCardStyles(variant), className)} 
      {...props}
    >
      {children}
    </Card>
  );
}

// Standardized Card Header
export function StandardCardHeader({ 
  title, 
  description, 
  icon, 
  action, 
  className 
}: StandardCardHeaderProps) {
  return (
    <CardHeader className={cn('pb-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon}
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
        {action}
      </div>
    </CardHeader>
  );
}

// Standardized Card Content
export function StandardCardContent({ children, className }: StandardCardContentProps) {
  return (
    <CardContent className={cn('pt-0', className)}>
      {children}
    </CardContent>
  );
}

// Stats Card for metrics and KPIs
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    label: string;
    positive?: boolean;
  };
  icon?: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon, 
  variant = 'default', 
  className 
}: StatsCardProps) {
  return (
    <StandardCard variant={variant} className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center text-sm">
            <span className={cn(
              change.positive !== false ? 'text-green-600' : 'text-red-600'
            )}>
              {change.value}
            </span>
            <span className="text-muted-foreground ml-1">{change.label}</span>
          </div>
        )}
      </CardContent>
    </StandardCard>
  );
}

// AI Insight Card
interface AIInsightCardProps {
  insight: {
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    content: string;
    confidence?: number;
    actionable?: boolean;
  };
  className?: string;
}

export function AIInsightCard({ insight, className }: AIInsightCardProps) {
  const variant = insight.type === 'success' ? 'success' :
                  insight.type === 'warning' ? 'warning' :
                  insight.type === 'error' ? 'error' : 'info';

  return (
    <StandardCard variant={variant} className={className}>
      <StandardCardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{insight.title}</h4>
            {insight.confidence && (
              <span className="text-xs text-muted-foreground">
                {insight.confidence}% confidence
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{insight.content}</p>
          {insight.actionable && (
            <div className="text-xs text-muted-foreground">
              💡 Actionable insight
            </div>
          )}
        </div>
      </StandardCardContent>
    </StandardCard>
  );
}

// Alert/Notification Card
interface AlertCardProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
}

export function AlertCard({ type, title, message, action, className }: AlertCardProps) {
  const variant = type as CardVariant;
  
  return (
    <StandardCard variant={variant} className={className}>
      <StandardCardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="font-medium">{title}</h4>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          {action}
        </div>
      </StandardCardContent>
    </StandardCard>
  );
}

export {
  StandardCard as Card,
  StandardCardHeader as CardHeader,
  StandardCardContent as CardContent,
};
