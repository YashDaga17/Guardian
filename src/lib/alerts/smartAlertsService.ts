// Smart Alerts System
// Implements intelligent price alerts as specified in PDF requirements

import { geminiAI } from '@/lib/ai/geminiService';

export interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  type: 'price_above' | 'price_below' | 'percent_change' | 'volume_spike' | 'pattern_detected';
  condition: {
    targetPrice?: number;
    percentChange?: number;
    volumeThreshold?: number;
    pattern?: string;
  };
  currentPrice: number;
  isActive: boolean;
  createdAt: number;
  triggeredAt?: number;
  aiInsight?: string;
}

export interface SmartAlertConfig {
  enableAIAnalysis: boolean;
  priceCheckInterval: number; // in milliseconds
  maxAlerts: number;
  enablePatternRecognition: boolean;
}

export class SmartAlertsService {
  private alerts: Map<string, PriceAlert> = new Map();
  private config: SmartAlertConfig;
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(alert: PriceAlert) => void> = new Set();

  constructor(config: Partial<SmartAlertConfig> = {}) {
    this.config = {
      enableAIAnalysis: true,
      priceCheckInterval: 30000, // 30 seconds
      maxAlerts: 50,
      enablePatternRecognition: true,
      ...config
    };

    // Load alerts from localStorage if available
    this.loadAlertsFromStorage();
    this.startMonitoring();
  }

  /**
   * Create a new price alert
   */
  createAlert(alert: Omit<PriceAlert, 'id' | 'createdAt' | 'isActive'>): string {
    if (this.alerts.size >= this.config.maxAlerts) {
      throw new Error(`Maximum number of alerts (${this.config.maxAlerts}) reached`);
    }

    const id = this.generateAlertId();
    const newAlert: PriceAlert = {
      ...alert,
      id,
      createdAt: Date.now(),
      isActive: true
    };

    this.alerts.set(id, newAlert);
    this.saveAlertsToStorage();
    
    return id;
  }

  /**
   * Delete an alert
   */
  deleteAlert(id: string): boolean {
    const deleted = this.alerts.delete(id);
    if (deleted) {
      this.saveAlertsToStorage();
    }
    return deleted;
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): PriceAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PriceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.isActive);
  }

  /**
   * Toggle alert active state
   */
  toggleAlert(id: string): boolean {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.isActive = !alert.isActive;
      this.saveAlertsToStorage();
      return true;
    }
    return false;
  }

  /**
   * Add event listener for alert triggers
   */
  onAlertTriggered(callback: (alert: PriceAlert) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Check if any alerts should be triggered
   */
  async checkAlerts(marketData: Array<{symbol: string, price: number, change24h: number, volume: number}>): Promise<void> {
    const activeAlerts = this.getActiveAlerts();
    
    for (const alert of activeAlerts) {
      const symbolData = marketData.find(data => data.symbol === alert.symbol);
      if (!symbolData) continue;

      const shouldTrigger = await this.shouldTriggerAlert(alert, symbolData);
      if (shouldTrigger) {
        await this.triggerAlert(alert, symbolData);
      }
    }
  }

  /**
   * Create AI-powered smart alerts based on portfolio
   */
  async createSmartAlertsForPortfolio(portfolio: Array<{symbol: string, allocation: number}>): Promise<string[]> {
    const alertIds: string[] = [];

    for (const asset of portfolio) {
      try {
        // Create volume spike alert
        const volumeAlertId = this.createAlert({
          symbol: asset.symbol,
          name: `${asset.symbol} Volume Spike`,
          type: 'volume_spike',
          condition: { volumeThreshold: 200 }, // 200% above average
          currentPrice: 0
        });
        alertIds.push(volumeAlertId);

        // Create AI pattern detection alert
        if (this.config.enablePatternRecognition) {
          const patternAlertId = this.createAlert({
            symbol: asset.symbol,
            name: `${asset.symbol} Pattern Detection`,
            type: 'pattern_detected',
            condition: { pattern: 'bullish_breakout' },
            currentPrice: 0
          });
          alertIds.push(patternAlertId);
        }

        // Create percentage change alert based on allocation
        const changeThreshold = asset.allocation > 10 ? 5 : 10; // Larger positions get tighter alerts
        const changeAlertId = this.createAlert({
          symbol: asset.symbol,
          name: `${asset.symbol} Price Movement`,
          type: 'percent_change',
          condition: { percentChange: changeThreshold },
          currentPrice: 0
        });
        alertIds.push(changeAlertId);

      } catch (error) {
        console.error(`Failed to create alert for ${asset.symbol}:`, error);
      }
    }

    return alertIds;
  }

  private async shouldTriggerAlert(alert: PriceAlert, symbolData: {symbol: string, price: number, change24h: number, volume: number}): Promise<boolean> {
    switch (alert.type) {
      case 'price_above':
        return symbolData.price >= (alert.condition.targetPrice || 0);
      
      case 'price_below':
        return symbolData.price <= (alert.condition.targetPrice || 0);
      
      case 'percent_change':
        return Math.abs(symbolData.change24h) >= (alert.condition.percentChange || 0);
      
      case 'volume_spike':
        // Mock volume spike detection (would need historical data in real implementation)
        const averageVolume = symbolData.volume / 2; // Simplified
        const volumeThreshold = alert.condition.volumeThreshold || 100;
        return symbolData.volume >= averageVolume * (volumeThreshold / 100);
      
      case 'pattern_detected':
        // Would integrate with technical analysis in real implementation
        if (this.config.enablePatternRecognition && this.config.enableAIAnalysis) {
          return await this.detectPattern(alert, symbolData);
        }
        return false;
      
      default:
        return false;
    }
  }

  private async triggerAlert(alert: PriceAlert, symbolData: {symbol: string, price: number, change24h: number, volume: number}): Promise<void> {
    // Update alert
    alert.triggeredAt = Date.now();
    alert.currentPrice = symbolData.price;
    alert.isActive = false; // Disable after triggering

    // Generate AI insight if enabled
    if (this.config.enableAIAnalysis) {
      try {
        alert.aiInsight = await this.generateAIInsight(alert, symbolData);
      } catch (error) {
        console.error('Failed to generate AI insight:', error);
      }
    }

    // Save updated alert
    this.saveAlertsToStorage();

    // Notify listeners
    this.listeners.forEach(callback => callback(alert));

    // Show browser notification if permission granted
    this.showBrowserNotification(alert);
  }

  private async generateAIInsight(alert: PriceAlert, symbolData: {symbol: string, price: number, change24h: number, volume: number}): Promise<string> {
    const _prompt = `
      Alert triggered for ${alert.symbol}:
      - Alert Type: ${alert.type}
      - Current Price: $${symbolData.price}
      - 24h Change: ${symbolData.change24h}%
      - Volume: ${symbolData.volume}
      
      Provide a brief analysis of why this alert triggered and what it might mean for traders.
      Keep response under 100 words.
    `;

    try {
      const insight = await geminiAI.explainMovement(alert.symbol, symbolData.change24h, { 
        price: symbolData.price, 
        volume: symbolData.volume,
        alertType: alert.type 
      });
      return insight;
    } catch (_error) {
      return `Alert triggered: ${alert.symbol} met ${alert.type} condition at $${symbolData.price}`;
    }
  }

  private async detectPattern(alert: PriceAlert, symbolData: {symbol: string, price: number, change24h: number, volume: number}): Promise<boolean> {
    // Simplified pattern detection - would need technical indicators in real implementation
    const pattern = alert.condition.pattern;
    
    switch (pattern) {
      case 'bullish_breakout':
        return symbolData.change24h > 5 && symbolData.volume > 1000000;
      case 'bearish_breakdown':
        return symbolData.change24h < -5 && symbolData.volume > 1000000;
      default:
        return false;
    }
  }

  private showBrowserNotification(alert: PriceAlert): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🚨 ${alert.name}`, {
        body: `${alert.symbol} triggered ${alert.type} alert at $${alert.currentPrice}`,
        icon: '/icon-192.png',
        tag: alert.id
      });
    }
  }

  private startMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      // This would integrate with real market data service
      console.log('Checking alerts...', this.getActiveAlerts().length, 'active alerts');
    }, this.config.priceCheckInterval);
  }

  private stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveAlertsToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const alertsArray = Array.from(this.alerts.entries());
        localStorage.setItem('tradely_smart_alerts', JSON.stringify(alertsArray));
      } catch (error) {
        console.error('Failed to save alerts to localStorage:', error);
      }
    }
  }

  private loadAlertsFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tradely_smart_alerts');
        if (saved) {
          const alertsArray = JSON.parse(saved);
          this.alerts = new Map(alertsArray);
        }
      } catch (error) {
        console.error('Failed to load alerts from localStorage:', error);
      }
    }
  }

  // Cleanup method
  destroy(): void {
    this.stopMonitoring();
    this.listeners.clear();
  }
}

// Export singleton instance
export const smartAlertsService = new SmartAlertsService();
