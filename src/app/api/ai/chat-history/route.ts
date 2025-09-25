import { NextRequest, NextResponse } from 'next/server';
import { aiChatService } from '@/lib/database/services';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limitParam = searchParams.get('limit') || '50';

    // Input validation
    if (!userId || userId.trim() === '') {
      return NextResponse.json(
        { error: 'userId is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Validate and sanitize limit
    const limit = parseInt(limitParam);
    if (isNaN(limit) || limit <= 0 || limit > 100) {
      return NextResponse.json(
        { error: 'limit must be a number between 1 and 100' },
        { status: 400 }
      );
    }

    const chatHistory = await aiChatService.getUserChatHistory(userId.trim(), limit);

    return NextResponse.json({
      success: true,
      data: chatHistory,
      count: chatHistory.length
    });

  } catch (error) {
    logger.error('AI Chat history API error', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
