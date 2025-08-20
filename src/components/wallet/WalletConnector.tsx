'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain, type Connector } from 'wagmi';
import { mainnet, polygon, arbitrum } from 'wagmi/chains';
import { 
  Wallet, 
  ChevronDown, 
  Copy, 
  ExternalLink, 
  LogOut, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useWalletStore, useUIStore } from '@/store';
import { formatCurrency } from '@/lib/blockchain/dataProviders';

const SUPPORTED_CHAINS = [
  { ...mainnet, icon: '🟦' },
  { ...polygon, icon: '🟣' },
  { ...arbitrum, icon: '🔵' },
];

export function WalletConnector() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });
  
  const { addNotification } = useUIStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
      addNotification({
        type: 'success',
        title: 'Address Copied',
        message: 'Wallet address copied to clipboard',
      });
    }
  };

  // Get current chain info
  const currentChain = SUPPORTED_CHAINS.find(chain => chain.id === chainId);

  // Handle connector click
  const handleConnect = (connector: Connector) => {
    connect({ connector });
    setIsDialogOpen(false);
  };

  // Handle disconnect
  const handleDisconnect = () => {
    disconnect();
    addNotification({
      type: 'info',
      title: 'Wallet Disconnected',
      message: 'Your wallet has been disconnected',
    });
  };

  // Handle chain switch
  const handleChainSwitch = (chain: typeof SUPPORTED_CHAINS[0]) => {
    if (chain.id !== chainId) {
      switchChain({ chainId: chain.id });
    }
  };

  if (!isConnected) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Your Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to start managing your DeFi portfolio
            </p>
            
            <div className="space-y-2">
              {connectors.map((connector) => (
                <Button
                  key={connector.id}
                  variant="outline"
                  className="w-full justify-start h-12"
                  onClick={() => handleConnect(connector)}
                  disabled={isConnecting}
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                      {connector.name === 'MetaMask' && '🦊'}
                      {connector.name === 'WalletConnect' && '🔗'}
                      {connector.name === 'Coinbase Wallet' && '📱'}
                      {!['MetaMask', 'WalletConnect', 'Coinbase Wallet'].includes(connector.name) && '👛'}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{connector.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {connector.name === 'MetaMask' && 'Browser extension'}
                        {connector.name === 'WalletConnect' && 'Scan QR code'}
                        {connector.name === 'Coinbase Wallet' && 'Mobile & extension'}
                        {!['MetaMask', 'WalletConnect', 'Coinbase Wallet'].includes(connector.name) && 'Web3 wallet'}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              By connecting a wallet, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {address?.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium">{formatAddress(address!)}</span>
            <span className="text-xs text-muted-foreground">
              {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0.0000 ETH'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {address?.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{formatAddress(address!)}</div>
              <div className="text-sm text-muted-foreground">
                {balance ? `${parseFloat(balance.formatted).toFixed(6)} ${balance.symbol}` : 'Loading...'}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {/* Current Network */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Current Network
        </DropdownMenuLabel>
        <div className="px-2 py-1">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{currentChain?.icon}</span>
              <span className="font-medium">{currentChain?.name}</span>
            </div>
            {chainId && SUPPORTED_CHAINS.some(chain => chain.id === chainId) ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-600" />
            )}
          </div>
        </div>

        {/* Switch Network */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Network
        </DropdownMenuLabel>
        {SUPPORTED_CHAINS.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            onClick={() => handleChainSwitch(chain)}
            disabled={chain.id === chainId}
            className="flex items-center space-x-2"
          >
            <span className="text-lg">{chain.icon}</span>
            <span>{chain.name}</span>
            {chain.id === chainId && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Current
              </Badge>
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Actions */}
        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="h-4 w-4 mr-2" />
          {copiedAddress ? 'Copied!' : 'Copy Address'}
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <a
            href={`${currentChain?.blockExplorers?.default?.url}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Explorer
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDisconnect} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
