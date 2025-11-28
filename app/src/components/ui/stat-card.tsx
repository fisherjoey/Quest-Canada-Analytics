import * as React from 'react';
import { cn } from '@src/lib/utils';
import { type IconColor, getKpiIconClass } from '@src/lib/style-utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  iconColor?: IconColor;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, icon, iconColor = 'quest-teal', description, trend, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('kpi-card', className)}
        {...props}
      >
        {icon && (
          <div className={getKpiIconClass(iconColor)}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="kpi-value">{value}</div>
          <div className="kpi-label">{title}</div>
          {description && (
            <div className="kpi-detail">{description}</div>
          )}
          {trend && (
            <div className={cn('kpi-trend', trend.isPositive ? 'kpi-trend-up' : 'kpi-trend-down')}>
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

StatCard.displayName = 'StatCard';

export { StatCard };
