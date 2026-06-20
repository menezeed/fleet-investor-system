'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

interface KpiCardProps {
  label: string;
  value: string;
  trend?: { month: string; value: number }[];
  tone?: 'neutral' | 'positive' | 'negative' | 'warning';
}

const toneColor: Record<string, string> = {
  neutral: 'hsl(var(--foreground))',
  positive: 'hsl(var(--success))',
  negative: 'hsl(var(--destructive))',
  warning: 'hsl(var(--warning))',
};

export function KpiCard({ label, value, trend, tone = 'neutral' }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span
            className={cn(
              'text-2xl font-semibold tabular-nums tracking-tight',
              tone === 'positive' && 'text-success',
              tone === 'negative' && 'text-destructive',
              tone === 'warning' && 'text-warning'
            )}
          >
            {value}
          </span>
        </div>
        {trend && trend.length > 1 && (
          <div className="h-10 w-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={toneColor[tone]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
