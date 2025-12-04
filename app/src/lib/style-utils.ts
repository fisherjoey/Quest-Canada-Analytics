/**
 * Style utilities for consistent theming across components
 * Used to map scores and statuses to appropriate CSS classes
 */

// Score level types
export type ScoreLevel = 'excellent' | 'good' | 'fair' | 'poor';

// Status types used across the application
export type Status = 'completed' | 'in-progress' | 'pending' | 'delayed' | 'cancelled';

// Priority types
export type Priority = 'high' | 'medium' | 'low';

// Icon color types for KPI cards
export type IconColor = 'success' | 'warning' | 'destructive' | 'info' | 'quest-teal' | 'primary';

/**
 * Get score level based on numeric score
 * @param score - Numeric score (0-100) or null
 * @returns ScoreLevel classification
 */
export function getScoreLevel(score: number | null): ScoreLevel {
  if (score === null) return 'poor';
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * Get score text color class
 * @param score - Numeric score (0-100) or null
 * @returns Tailwind class for text color
 */
export function getScoreTextClass(score: number | null): string {
  const level = getScoreLevel(score);
  return `score-${level}`;
}

/**
 * Get score background color class
 * @param score - Numeric score (0-100) or null
 * @returns Tailwind class for background color
 */
export function getScoreBgClass(score: number | null): string {
  const level = getScoreLevel(score);
  return `score-bg-${level}`;
}

/**
 * Get status badge classes
 * @param status - Status type
 * @returns Combined classes for status badge
 */
export function getStatusClasses(status: Status): string {
  return `status-badge status-${status}`;
}

/**
 * Get priority badge classes
 * @param priority - Priority level
 * @returns Combined classes for priority badge
 */
export function getPriorityClasses(priority: Priority): string {
  return `status-badge priority-${priority}`;
}

/**
 * Get KPI icon color class
 * @param color - Icon color type
 * @returns Tailwind class for icon styling
 */
export function getKpiIconClass(color: IconColor): string {
  return `kpi-icon kpi-icon-${color}`;
}

// Chart color palette using CSS variable values
// These are HSL values that match our design tokens (teal-based theme)
export const CHART_COLORS = {
  questTeal: 'hsl(173, 100%, 33%)',
  destructive: 'hsl(0, 84%, 60%)',
  info: 'hsl(199, 89%, 48%)',
  warning: 'hsl(38, 92%, 50%)',
  success: 'hsl(160, 65%, 40%)',
  primary: 'hsl(173, 100%, 33%)',
  secondary: 'hsl(173, 60%, 45%)',
  purple: 'hsl(271, 40%, 55%)',
} as const;

// Array of chart colors for sequential use
export const CHART_COLOR_PALETTE = [
  CHART_COLORS.questTeal,
  CHART_COLORS.info,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.destructive,
  CHART_COLORS.purple,
  CHART_COLORS.secondary,
] as const;

// Score color map for charts
export const SCORE_CHART_COLORS = {
  excellent: CHART_COLORS.success,
  good: CHART_COLORS.info,
  fair: CHART_COLORS.warning,
  poor: CHART_COLORS.destructive,
} as const;

/**
 * Get chart color for a score
 * @param score - Numeric score (0-100) or null
 * @returns HSL color string for charts
 */
export function getScoreChartColor(score: number | null): string {
  const level = getScoreLevel(score);
  return SCORE_CHART_COLORS[level];
}

// Status colors for charts (matches CSS classes)
export const STATUS_CHART_COLORS = {
  completed: CHART_COLORS.success,
  'in-progress': CHART_COLORS.info,
  pending: 'hsl(173, 10%, 45%)', // muted-foreground
  delayed: CHART_COLORS.warning,
  cancelled: CHART_COLORS.destructive,
} as const;

// Priority colors for charts
export const PRIORITY_CHART_COLORS = {
  high: CHART_COLORS.destructive,
  medium: CHART_COLORS.warning,
  low: CHART_COLORS.success,
} as const;
