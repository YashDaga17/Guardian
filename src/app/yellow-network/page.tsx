'use client';

import { YellowNetworkInterface } from '@/components/nitrolite/YellowNetworkInterface';

export default function YellowNetworkPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Yellow Network Testnet</h1>
        <p className="text-muted-foreground text-lg">
          Experience instant, low-cost transactions using Nitrolite state channels on the Yellow Network sandbox environment.
        </p>
      </div>
      
      <YellowNetworkInterface />
    </div>
  );
}
