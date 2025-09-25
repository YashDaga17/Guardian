'use client';

import { GeminiAIService } from '@/lib/ai/geminiService';

// Global AI service instance with request caching and deduplication
let globalAIService: GeminiAIService | null = null;

export const getAIService = (userId?: string): GeminiAIService => {
  if (!globalAIService) {
    globalAIService = new GeminiAIService(userId);
    console.log('[AI] Global AI service instance created');
  }
  return globalAIService;
};

// Export singleton for use across components
export { globalAIService };
