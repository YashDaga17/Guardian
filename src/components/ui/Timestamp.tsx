// Client-only timestamp component to prevent hydration mismatches
'use client';

import { useEffect, useState, useMemo } from 'react';

interface TimestampProps {
  timestamp: number;
  format?: 'time' | 'date' | 'datetime';
  className?: string;
}

export function Timestamp({ timestamp, format = 'time', className }: TimestampProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize formatted time to prevent unnecessary recalculations
  const formattedTime = useMemo(() => {
    if (!mounted) return '--:--:--';
    
    const date = new Date(timestamp);
    
    switch (format) {
      case 'time':
        return date.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      case 'date':
        return date.toLocaleDateString('en-US');
      case 'datetime':
        return date.toLocaleString('en-US');
      default:
        return date.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
    }
  }, [mounted, timestamp, format]);

  return <span className={className}>{formattedTime}</span>;
}
