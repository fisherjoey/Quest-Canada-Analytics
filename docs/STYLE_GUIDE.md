# Quest Canada CSS Style Guide

This document outlines the standardized CSS patterns and components used throughout the Quest Canada web application.

## Design Tokens

### Color System

All colors are defined as CSS variables in `Main.css` and configured in `tailwind.config.js`.

#### Semantic Colors

| Token | Usage | Light Mode | Dark Mode |
|-------|-------|------------|-----------|
| `primary` | Main brand color, CTAs | Green | Light green |
| `secondary` | Secondary actions | Lighter green | - |
| `destructive` | Errors, delete actions | Red | - |
| `success` | Success states, excellent scores | Green | - |
| `warning` | Caution, medium priority | Amber | - |
| `info` | Information, good scores | Blue | - |
| `quest-teal` | Dashboard accent | Teal (#00a9a6) | - |
| `muted` | Secondary content | Light gray | Dark gray |

#### Muted Backgrounds

For badges and subtle backgrounds:
- `bg-success-muted` - Light green background
- `bg-warning-muted` - Light amber background
- `bg-destructive-muted` - Light red background
- `bg-info-muted` - Light blue background
- `bg-quest-teal-muted` - Light teal background

## Shared Components

### StatusBadge

```tsx
import { StatusBadge } from '@src/components/ui/status-badge';

<StatusBadge status="completed" />
<StatusBadge status="in-progress" />
<StatusBadge status="pending" />
<StatusBadge status="delayed" />
<StatusBadge status="cancelled" />
```

### PriorityBadge

```tsx
import { PriorityBadge } from '@src/components/ui/priority-badge';

<PriorityBadge priority="high" />
<PriorityBadge priority="medium" />
<PriorityBadge priority="low" />
```

### StatCard

```tsx
import { StatCard } from '@src/components/ui/stat-card';
import { Users } from 'lucide-react';

<StatCard
  title="Total Users"
  value={1234}
  icon={<Users className="w-6 h-6" />}
  iconColor="quest-teal"
  description="Active this month"
  trend={{ value: 12, isPositive: true }}
/>
```

Icon colors: `success`, `warning`, `destructive`, `info`, `quest-teal`, `primary`

### ChartContainer

```tsx
import { ChartContainer } from '@src/components/ui/chart-container';

<ChartContainer
  title="Revenue Over Time"
  description="Monthly breakdown"
  isEmpty={data.length === 0}
  emptyMessage="No revenue data available"
>
  <ApexChart {...chartOptions} />
</ChartContainer>
```

### PageHeader

```tsx
import { PageHeader } from '@src/components/ui/page-header';
import { Button } from '@src/components/ui/button';

<PageHeader
  title="Assessments"
  description="Manage your community assessments"
  backLink={{ to: '/dashboard', label: 'Back to Dashboard' }}
  actions={<Button>Create New</Button>}
/>
```

### DashboardTab

```tsx
import { DashboardTab } from '@src/components/ui/dashboard-tab';
import { BarChart } from 'lucide-react';

<DashboardTab
  label="Analytics"
  icon={<BarChart className="w-4 h-4" />}
  isActive={activeTab === 'analytics'}
  onClick={() => setActiveTab('analytics')}
/>
```

## CSS Classes

### Dashboard Widgets

```tsx
<div className="dashboard-widget">
  <div className="dashboard-widget-header">
    <h3 className="dashboard-widget-title">Widget Title</h3>
  </div>
  <div className="dashboard-widget-content">
    {/* Content */}
  </div>
</div>
```

### KPI Cards (Manual)

```tsx
<div className="kpi-card">
  <div className="kpi-icon kpi-icon-success">
    <Icon />
  </div>
  <div>
    <div className="kpi-value">42%</div>
    <div className="kpi-label">Completion Rate</div>
    <div className="kpi-detail">10 of 24 tasks</div>
  </div>
</div>
```

### Page Layout

```tsx
<div className="page-container">
  <div className="page-header">
    <h1 className="page-title">Page Title</h1>
    <p className="page-description">Description</p>
  </div>
  {/* Content */}
</div>
```

### Forms

```tsx
<div className="form-container">
  <div className="form-grid">
    <div>
      <label className="form-label">Field Label</label>
      <Input />
      <span className="form-error">Error message</span>
    </div>
  </div>
</div>
```

## Style Utilities

Import from `@src/lib/style-utils`:

```tsx
import {
  getScoreLevel,
  getScoreTextClass,
  getScoreBgClass,
  getStatusClasses,
  getPriorityClasses,
  CHART_COLORS,
  CHART_COLOR_PALETTE,
  getScoreChartColor,
} from '@src/lib/style-utils';

// Score classification (0-100)
getScoreLevel(85);        // 'excellent'
getScoreLevel(65);        // 'good'
getScoreLevel(45);        // 'fair'
getScoreLevel(25);        // 'poor'

// Score classes
getScoreTextClass(85);    // 'score-excellent'
getScoreBgClass(85);      // 'score-bg-excellent'

// Chart colors
CHART_COLORS.questTeal;   // 'hsl(173, 100%, 33%)'
getScoreChartColor(85);   // success color for charts
```

## Do's and Don'ts

### DO

- Use CSS variables via Tailwind classes: `bg-primary`, `text-muted-foreground`
- Use the shared components for badges, stats, and containers
- Use `cn()` utility for conditional classes
- Use semantic color names for meaning

### DON'T

- Use hardcoded hex colors: `#00a9a6`, `#e74c3c`
- Use inline `<style>` tags in components
- Use inline `style={{}}` for colors (exception: chart libraries)
- Create new badge/status patterns without using the standard classes

## Migration Pattern

When refactoring existing components:

1. Remove `<style>{...}</style>` blocks
2. Replace hardcoded colors with Tailwind classes
3. Use shared components where applicable
4. Apply standard CSS classes from this guide
