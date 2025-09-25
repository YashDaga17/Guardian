'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageCircle, 
  Send, 
  Brain, 
  TrendingUp, 
  AlertTriangle,
  Lightbulb,
  X,
  Minimize2,
  Maximize2,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AIMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
  confidence?: number;
  actionType?: 'analysis' | 'recommendation' | 'explanation' | 'warning';
  relatedAssets?: string[];
}

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function AIAssistant({ isOpen, onToggle, className }: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "👋 Welcome to Tradely AI Investment Advisor! I'm here to help you make informed crypto investment decisions. I can provide:\n\n🎯 Personalized crypto recommendations\n📊 Market analysis & risk assessment\n🏢 Project backgrounds & fundamentals\n⚠️ Risk warnings for specific tokens\n\nWhat crypto or investment question can I help you with today?",
      timestamp: Date.now(),
      confidence: 95,
      actionType: 'explanation'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Minimum time between requests (in milliseconds) to prevent spam
  const MIN_REQUEST_INTERVAL = 5000; // Increased to 5 seconds between requests

  // Memoize callbacks to prevent unnecessary re-renders
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Only scroll when messages change, not on every render
  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages.length, scrollToBottom]);

  // Focus input only when needed
  useEffect(() => {
    if (isOpen && !isMinimized && !isTyping) {
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isMinimized, isTyping]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const generateAIResponse = useCallback(async (userMessage: string): Promise<AIMessage> => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      console.log('🤖 Sending request to Gemini API:', userMessage);
      
      // Determine request type and if portfolio data is needed
      const lowerMessage = userMessage.toLowerCase();
      
      let requestType = 'investment_advice';
      let includePortfolio = false;
      
      // Check if user is asking about their portfolio specifically
      const portfolioKeywords = ['my portfolio', 'my holdings', 'my crypto', 'my investments', 'my balance', 'how much', 'what should i', 'rebalance', 'diversify'];
      const isPortfolioQuery = portfolioKeywords.some(keyword => lowerMessage.includes(keyword));
      
      if (isPortfolioQuery || lowerMessage.includes('portfolio')) {
        requestType = 'portfolio_recommendation';
        includePortfolio = true;
      } else if (lowerMessage.includes('bitcoin') || lowerMessage.includes('btc') || 
                 lowerMessage.includes('ethereum') || lowerMessage.includes('eth') ||
                 lowerMessage.includes('solana') || lowerMessage.includes('sol')) {
        requestType = 'crypto_analysis';
        includePortfolio = true; // Include to see if user already holds this crypto
      } else if (lowerMessage.includes('risk') || lowerMessage.includes('danger')) {
        requestType = 'risk_warning';
        includePortfolio = true;
      } else if (lowerMessage.includes('buy') || lowerMessage.includes('sell') || lowerMessage.includes('should i')) {
        requestType = 'investment_advice';
        includePortfolio = true;
      }
      
      // Single API call with timeout and abort signal
      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          type: requestType,
          includePortfolio,
          userId: 'demo-user' // Replace with actual user ID from auth
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: data.content || "I couldn't process your request right now.",
        timestamp: Date.now(),
        confidence: data.confidence || 85,
        actionType: requestType === 'crypto_analysis' ? 'analysis' : 
                   requestType === 'portfolio_recommendation' ? 'recommendation' : 'explanation',
        relatedAssets: requestType === 'crypto_analysis' ? ['BTC', 'ETH'] : []
      };
    } catch (error: unknown) {
      // Handle abort gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      console.error('AI response error:', error);
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: "I'm having trouble connecting right now. Please check your API key and try again in a moment.",
        timestamp: Date.now(),
        confidence: 0,
        actionType: 'warning'
      };
    }
  }, []); // Empty dependency array - this function doesn't depend on any state

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isTyping) return; // Prevent sending while already processing

    // Enforce rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
      const errorMessage: AIMessage = {
        id: `error-${now}`,
        type: 'ai',
        content: `Please wait ${waitTime} more seconds before sending another message to prevent rate limiting.`,
        timestamp: now,
        confidence: 0,
        actionType: 'warning'
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Create user message
    const userMessage: AIMessage = {
      id: `user-${now}`,
      type: 'user',
      content: trimmedInput,
      timestamp: now
    };

    // Update state in single batch
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setLastRequestTime(now);

    try {
      const aiResponse = await generateAIResponse(trimmedInput);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error: unknown) {
      // Don't show error if request was aborted (user sent another message)
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: "Sorry, I couldn't process your request. Please try again.",
        timestamp: Date.now(),
        confidence: 0,
        actionType: 'warning'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping, lastRequestTime, generateAIResponse]); // Only depend on necessary values

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Memoize helper functions to prevent re-renders
  const getActionIcon = useCallback((actionType?: AIMessage['actionType']) => {
    switch (actionType) {
      case 'analysis': return <TrendingUp className="h-4 w-4" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  }, []);

  const getActionColor = useCallback((actionType?: AIMessage['actionType']) => {
    switch (actionType) {
      case 'analysis': return 'text-blue-600';
      case 'recommendation': return 'text-green-600';
      case 'warning': return 'text-red-600';
      default: return 'text-purple-600';
    }
  }, []);

  const formatTimestamp = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 z-50"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-80 sm:w-96 h-[500px] sm:h-[600px] max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] shadow-2xl z-50 flex flex-col ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 py-3 flex-shrink-0">
        <CardTitle className="flex items-center text-base sm:text-lg">
          <Brain className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
          AI Assistant
          <Badge variant="secondary" className="ml-2 text-xs">
            Gemini
          </Badge>
        </CardTitle>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0"
          >
            {isMinimized ? <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" /> : <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0">
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="flex flex-col flex-1 p-3 sm:p-4 pt-0 overflow-hidden">
          <ScrollArea className="flex-1 pr-2 sm:pr-4">
            <div className="space-y-3 sm:space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2 sm:p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white ml-2 sm:ml-4'
                        : 'bg-muted mr-2 sm:mr-4'
                    }`}
                  >
                    {message.type === 'ai' && message.actionType && (
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <div className={`flex items-center gap-1 text-xs ${getActionColor(message.actionType)}`}>
                          {getActionIcon(message.actionType)}
                          <span className="capitalize">{message.actionType}</span>
                        </div>
                        {message.confidence && message.confidence > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {message.confidence}% confidence
                          </Badge>
                        )}
                      </div>
                    )}
                    <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
                    {message.relatedAssets && message.relatedAssets.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 sm:mt-2">
                        {message.relatedAssets.map((asset) => (
                          <Badge key={asset} variant="secondary" className="text-xs">
                            {asset}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="text-xs opacity-70 mt-1">
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-2 sm:p-3 mr-2 sm:mr-4">
                    <div className="flex items-center space-x-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs text-muted-foreground">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2 px-1 py-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!isTyping) {
                  setInputValue("What cryptocurrencies should I invest in right now?");
                  // Use shorter timeout to reduce delay
                  setTimeout(() => handleSendMessage(), 50);
                }
              }}
              className="text-xs px-2 py-1 h-auto"
              disabled={isTyping}
            >
              🎯 Get Recommendations
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!isTyping) {
                  setInputValue("Tell me about Bitcoin and Ethereum as investments");
                  setTimeout(() => handleSendMessage(), 50);
                }
              }}
              className="text-xs px-2 py-1 h-auto"
              disabled={isTyping}
            >
              📊 Analyze BTC/ETH
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!isTyping) {
                  setInputValue("What are the main risks in crypto investing right now?");
                  setTimeout(() => handleSendMessage(), 50);
                }
              }}
              className="text-xs px-2 py-1 h-auto"
              disabled={isTyping}
            >
              ⚠️ Risk Analysis
            </Button>
          </div>

          <div className="flex items-center space-x-2 mt-3 sm:mt-4 px-1">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about markets, portfolio, trading strategies..."
              className="flex-1 text-sm"
              disabled={isTyping}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputValue.trim() || isTyping}
              size="sm"
              className="h-9 w-9 p-0 sm:h-10 sm:w-10"
            >
              {isTyping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 sm:h-4 sm:w-4" />}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground mt-2 text-center px-1">
            Powered by Gemini AI • Real-time market data • Educational purposes only
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Test export
export default AIAssistant;
