import React, { memo } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatTransactionTime } from '@/store/dashboardStore';

interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'swap';
  asset: string;
  amount: string;
  value: string;
  timestamp: number;
  status: 'confirmed' | 'pending';
  batchId?: string;
}

interface TransactionItemProps {
  transaction: Transaction;
  isClient: boolean;
}

export const TransactionItem = memo(({ transaction: tx, isClient }: TransactionItemProps) => {
  const getStatusColor = (status: string) => {
    return status === 'confirmed' ? 'text-green-600' : 'text-yellow-600';
  };

  const getTransactionIcon = () => {
    switch (tx.type) {
      case 'buy':
        return <ArrowUpRight className="h-4 w-4" />;
      case 'sell':
        return <ArrowDownRight className="h-4 w-4" />;
      default:
        return <ArrowUpRight className="h-4 w-4 rotate-90" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-border/40 last:border-b-0">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full ${getStatusColor(tx.status)} bg-muted`}>
          {getTransactionIcon()}
        </div>
        <div>
          <div className="font-medium capitalize">{tx.type} {tx.asset}</div>
          <div className="text-sm text-muted-foreground">
            {tx.amount} • {formatTransactionTime(tx.timestamp, isClient)}
            {tx.batchId && (
              <Badge variant="outline" className="ml-2 text-xs">
                Batched
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">{tx.value}</div>
        <div className={`text-sm ${getStatusColor(tx.status)}`}>
          {tx.status}
        </div>
      </div>
    </div>
  );
});

TransactionItem.displayName = 'TransactionItem';
