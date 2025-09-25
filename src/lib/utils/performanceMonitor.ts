/**
 * Performance monitoring utilities for Tradely DeFi Platform
 */

import React from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  timestamp: number;
  props?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000; // Keep only the last 1000 metrics

  measureRender<T>(componentName: string, renderFn: () => T, props?: Record<string, unknown>): T {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    
    this.addMetric({
      componentName,
      renderTime: endTime - startTime,
      timestamp: Date.now(),
      props
    });
    
    return result;
  }

  private addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only the last N metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow renders in development
    if (process.env.NODE_ENV === 'development' && metric.renderTime > 16.67) { // > 60fps
      console.warn(`[Performance] Slow render detected in ${metric.componentName}: ${metric.renderTime.toFixed(2)}ms`);
    }
  }

  getMetrics(componentName?: string): PerformanceMetrics[] {
    if (componentName) {
      return this.metrics.filter(m => m.componentName === componentName);
    }
    return [...this.metrics];
  }

  getAverageRenderTime(componentName?: string): number {
    const relevantMetrics = this.getMetrics(componentName);
    if (relevantMetrics.length === 0) return 0;
    
    const totalTime = relevantMetrics.reduce((sum, m) => sum + m.renderTime, 0);
    return totalTime / relevantMetrics.length;
  }

  getSlowestComponents(limit = 10): Array<{ componentName: string; averageTime: number; count: number }> {
    const componentStats = new Map<string, { totalTime: number; count: number }>();
    
    this.metrics.forEach(metric => {
      const existing = componentStats.get(metric.componentName) || { totalTime: 0, count: 0 };
      componentStats.set(metric.componentName, {
        totalTime: existing.totalTime + metric.renderTime,
        count: existing.count + 1
      });
    });

    return Array.from(componentStats.entries())
      .map(([componentName, stats]) => ({
        componentName,
        averageTime: stats.totalTime / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, limit);
  }

  clearMetrics() {
    this.metrics = [];
  }

  logReport() {
    console.group('[Performance Monitor] Report');
    console.log('Total components monitored:', new Set(this.metrics.map(m => m.componentName)).size);
    console.log('Total renders tracked:', this.metrics.length);
    console.log('Slowest components:');
    console.table(this.getSlowestComponents(5));
    console.groupEnd();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React Hook for performance monitoring
export function usePerformanceMonitor(componentName: string, props?: Record<string, unknown>) {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    performanceMonitor.measureRender(componentName, () => null, {
      ...props,
      renderTime: endTime - startTime
    });
  };
}

// HOC for automatic performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const MonitoredComponent = (props: P) => {
    const actualName = componentName || Component.displayName || Component.name || 'Unknown';
    
    return performanceMonitor.measureRender(
      actualName,
      () => React.createElement(Component, props),
      props as Record<string, unknown>
    );
  };

  MonitoredComponent.displayName = `withPerformanceMonitoring(${componentName || Component.displayName || Component.name})`;
  
  return MonitoredComponent;
}

// Debounce utility for performance
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
  immediate = false
): T {
  let timeout: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  }) as T;
}

// Throttle utility for performance
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

export default performanceMonitor;
