import * as React from 'react';
import { cn } from '../../lib/utils';
import { BarChart3 } from 'lucide-react';

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  children: React.ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  actions?: React.ReactNode;
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ title, description, children, isEmpty, emptyMessage = 'No data available', actions, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('dashboard-widget', className)}
        {...props}
      >
        <div className="dashboard-widget-header">
          <div>
            <h3 className="dashboard-widget-title">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
        <div className="dashboard-widget-content">
          {isEmpty ? (
            <div className="chart-placeholder">
              <div className="flex flex-col items-center gap-2">
                <BarChart3 className="w-8 h-8 text-muted-foreground/50" />
                <span>{emptyMessage}</span>
              </div>
            </div>
          ) : (
            <div className="chart-container">
              {children}
            </div>
          )}
        </div>
      </div>
    );
  }
);

ChartContainer.displayName = 'ChartContainer';

export { ChartContainer };
