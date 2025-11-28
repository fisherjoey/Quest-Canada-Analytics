import * as React from 'react';
import { cn } from '../../lib/utils';
import { Link } from 'wasp/client/router';
import { ArrowLeft } from 'lucide-react';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backLink?: {
    to: string;
    label?: string;
  };
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, actions, backLink, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('page-header', className)}
        {...props}
      >
        <div>
          {backLink && (
            <Link
              to={backLink.to as any}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {backLink.label || 'Back'}
            </Link>
          )}
          <h1 className="page-title">{title}</h1>
          {description && (
            <p className="page-description">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    );
  }
);

PageHeader.displayName = 'PageHeader';

export { PageHeader };
