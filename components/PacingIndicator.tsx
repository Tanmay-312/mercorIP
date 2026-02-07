'use client';

import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface PacingIndicatorProps {
  lastResponseTime: number;
  averageResponseTime: number;
}

export function PacingIndicator({ lastResponseTime, averageResponseTime }: PacingIndicatorProps) {
  const getPacingStatus = () => {
    if (lastResponseTime < 5) {
      return {
        status: 'Too Fast',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-400/10',
        borderColor: 'border-yellow-400/30',
        icon: TrendingUp,
        message: 'Take your time to think through your answers',
      };
    } else if (lastResponseTime > 30) {
      return {
        status: 'Long Silence',
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        borderColor: 'border-red-400/30',
        icon: Clock,
        message: 'Try to provide more concise responses',
      };
    } else {
      return {
        status: 'Good Pacing',
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
        borderColor: 'border-green-400/30',
        icon: TrendingDown,
        message: 'You are maintaining good response timing',
      };
    }
  };

  const pacing = getPacingStatus();
  const Icon = pacing.icon;

  return (
    <Card className={`p-4 ${pacing.bgColor} border ${pacing.borderColor}`}>
      <div className="flex items-center space-x-3">
        <Icon className={`w-5 h-5 ${pacing.color}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className={`font-semibold ${pacing.color}`}>{pacing.status}</span>
            <span className="text-slate-400 text-sm">
              Avg: {averageResponseTime.toFixed(1)}s
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{pacing.message}</p>
        </div>
      </div>
    </Card>
  );
}
