'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Play,
  Pause
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { smartAlertsService, PriceAlert } from '@/lib/alerts/smartAlertsService';

interface SmartAlertsDashboardProps {
  className?: string;
}

export function SmartAlertsDashboard({ className }: SmartAlertsDashboardProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    name: '',
    type: 'price_above' as PriceAlert['type'],
    targetPrice: '',
    percentChange: '',
    volumeThreshold: ''
  });

  // Load alerts on component mount
  useEffect(() => {
    setAlerts(smartAlertsService.getAllAlerts());

    // Listen for alert triggers
    const unsubscribe = smartAlertsService.onAlertTriggered((alert) => {
      setAlerts(smartAlertsService.getAllAlerts());
      // Show notification
      showNotification(alert);
    });

    return unsubscribe;
  }, []);

  const showNotification = (_alert: PriceAlert) => {
    // Request notification permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleCreateAlert = () => {
    try {
      const condition: Record<string, number> = {};
      
      switch (newAlert.type) {
        case 'price_above':
        case 'price_below':
          condition.targetPrice = parseFloat(newAlert.targetPrice);
          break;
        case 'percent_change':
          condition.percentChange = parseFloat(newAlert.percentChange);
          break;
        case 'volume_spike':
          condition.volumeThreshold = parseFloat(newAlert.volumeThreshold);
          break;
      }

      smartAlertsService.createAlert({
        symbol: newAlert.symbol.toUpperCase(),
        name: newAlert.name || `${newAlert.symbol} Alert`,
        type: newAlert.type,
        condition,
        currentPrice: 0 // Will be updated when checked
      });

      setAlerts(smartAlertsService.getAllAlerts());
      setIsCreateDialogOpen(false);
      setNewAlert({
        symbol: '',
        name: '',
        type: 'price_above',
        targetPrice: '',
        percentChange: '',
        volumeThreshold: ''
      });
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const handleDeleteAlert = (id: string) => {
    smartAlertsService.deleteAlert(id);
    setAlerts(smartAlertsService.getAllAlerts());
  };

  const handleToggleAlert = (id: string) => {
    smartAlertsService.toggleAlert(id);
    setAlerts(smartAlertsService.getAllAlerts());
  };

  const activeAlerts = alerts.filter(alert => alert.isActive);
  const triggeredAlerts = alerts.filter(alert => alert.triggeredAt);
  const allAlerts = alerts;

  const formatCondition = (alert: PriceAlert) => {
    switch (alert.type) {
      case 'price_above':
        return `Price above $${alert.condition.targetPrice}`;
      case 'price_below':
        return `Price below $${alert.condition.targetPrice}`;
      case 'percent_change':
        return `Change ±${alert.condition.percentChange}%`;
      case 'volume_spike':
        return `Volume spike ${alert.condition.volumeThreshold}%`;
      case 'pattern_detected':
        return `Pattern: ${alert.condition.pattern}`;
      default:
        return 'Custom condition';
    }
  };

  const getAlertIcon = (type: PriceAlert['type']) => {
    switch (type) {
      case 'price_above':
        return <TrendingUp className="h-4 w-4" />;
      case 'price_below':
        return <TrendingDown className="h-4 w-4" />;
      case 'percent_change':
        return <AlertTriangle className="h-4 w-4" />;
      case 'volume_spike':
        return <BellRing className="h-4 w-4" />;
      case 'pattern_detected':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (alert: PriceAlert) => {
    if (alert.triggeredAt) {
      return <Badge variant="destructive">Triggered</Badge>;
    }
    if (alert.isActive) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Paused</Badge>;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Smart Alerts
              {activeAlerts.length > 0 && (
                <Badge variant="secondary">{activeAlerts.length} active</Badge>
              )}
            </CardTitle>
            <CardDescription>
              AI-powered price alerts with smart pattern recognition
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Smart Alert</DialogTitle>
                <DialogDescription>
                  Set up intelligent alerts for price movements and patterns
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="e.g., BTC, AAPL, ETH"
                    value={newAlert.symbol}
                    onChange={(e) => setNewAlert({...newAlert, symbol: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="name">Alert Name</Label>
                  <Input
                    id="name"
                    placeholder="Optional custom name"
                    value={newAlert.name}
                    onChange={(e) => setNewAlert({...newAlert, name: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="type">Alert Type</Label>
                  <Select value={newAlert.type} onValueChange={(value: PriceAlert['type']) => setNewAlert({...newAlert, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price_above">Price Above</SelectItem>
                      <SelectItem value="price_below">Price Below</SelectItem>
                      <SelectItem value="percent_change">Percent Change</SelectItem>
                      <SelectItem value="volume_spike">Volume Spike</SelectItem>
                      <SelectItem value="pattern_detected">Pattern Detection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(newAlert.type === 'price_above' || newAlert.type === 'price_below') && (
                  <div>
                    <Label htmlFor="targetPrice">Target Price ($)</Label>
                    <Input
                      id="targetPrice"
                      type="number"
                      placeholder="0.00"
                      value={newAlert.targetPrice}
                      onChange={(e) => setNewAlert({...newAlert, targetPrice: e.target.value})}
                    />
                  </div>
                )}

                {newAlert.type === 'percent_change' && (
                  <div>
                    <Label htmlFor="percentChange">Percent Change (%)</Label>
                    <Input
                      id="percentChange"
                      type="number"
                      placeholder="5.0"
                      value={newAlert.percentChange}
                      onChange={(e) => setNewAlert({...newAlert, percentChange: e.target.value})}
                    />
                  </div>
                )}

                {newAlert.type === 'volume_spike' && (
                  <div>
                    <Label htmlFor="volumeThreshold">Volume Spike Threshold (%)</Label>
                    <Input
                      id="volumeThreshold"
                      type="number"
                      placeholder="200"
                      value={newAlert.volumeThreshold}
                      onChange={(e) => setNewAlert({...newAlert, volumeThreshold: e.target.value})}
                    />
                  </div>
                )}

                <Button onClick={handleCreateAlert} className="w-full">
                  Create Alert
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">
              Active ({activeAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="triggered">
              Triggered ({triggeredAlerts.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({allAlerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active alerts. Create your first alert to get started!</p>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert} 
                  onDelete={handleDeleteAlert}
                  onToggle={handleToggleAlert}
                  formatCondition={formatCondition}
                  getAlertIcon={getAlertIcon}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="triggered" className="space-y-4">
            {triggeredAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No triggered alerts yet.</p>
              </div>
            ) : (
              triggeredAlerts.map((alert) => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert} 
                  onDelete={handleDeleteAlert}
                  onToggle={handleToggleAlert}
                  formatCondition={formatCondition}
                  getAlertIcon={getAlertIcon}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {allAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No alerts created yet. Create your first alert!</p>
              </div>
            ) : (
              allAlerts.map((alert) => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert} 
                  onDelete={handleDeleteAlert}
                  onToggle={handleToggleAlert}
                  formatCondition={formatCondition}
                  getAlertIcon={getAlertIcon}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface AlertCardProps {
  alert: PriceAlert;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  formatCondition: (alert: PriceAlert) => string;
  getAlertIcon: (type: PriceAlert['type']) => React.ReactNode;
  getStatusBadge: (alert: PriceAlert) => React.ReactNode;
}

function AlertCard({ alert, onDelete, onToggle, formatCondition, getAlertIcon, getStatusBadge }: AlertCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-muted rounded-full">
          {getAlertIcon(alert.type)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{alert.symbol}</span>
            {getStatusBadge(alert)}
          </div>
          <div className="text-sm text-muted-foreground">{alert.name}</div>
          <div className="text-sm text-muted-foreground">{formatCondition(alert)}</div>
          {alert.triggeredAt && (
            <div className="text-xs text-blue-600 mt-1">
              Triggered {new Date(alert.triggeredAt).toLocaleDateString()}
            </div>
          )}
          {alert.aiInsight && (
            <div className="text-xs text-green-600 mt-1 max-w-md">
              AI: {alert.aiInsight}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {alert.triggeredAt && (
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Triggered
          </Badge>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle(alert.id)}
        >
          {alert.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(alert.id)}
          className="text-red-600 hover:text-red-800"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
