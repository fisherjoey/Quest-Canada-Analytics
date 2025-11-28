/**
 * Grafana Dashboard Embedding Component
 *
 * Embeds Grafana dashboards into the Quest Canada React application
 * using iframe with optional anonymous/kiosk modes
 */

import React from 'react';

interface GrafanaDashboardProps {
  /**
   * Dashboard UID from Grafana (found in dashboard URL or settings)
   * Example: 'quest-home-overview'
   */
  dashboardUid: string;

  /**
   * Dashboard title for display
   */
  title?: string;

  /**
   * Grafana base URL
   * @default 'https://cpsc405.joeyfishertech.com/grafana'
   */
  grafanaUrl?: string;

  /**
   * Kiosk mode: removes Grafana UI chrome
   * - 'tv': Full kiosk (no panels, just visualization)
   * - true: Standard kiosk (minimal UI)
   * - false: Full Grafana UI
   * @default true
   */
  kiosk?: boolean | 'tv';

  /**
   * Time range for dashboard
   * @default 'from=now-24h&to=now'
   */
  timeRange?: string;

  /**
   * Dashboard theme
   * @default 'light'
   */
  theme?: 'light' | 'dark';

  /**
   * Refresh interval (e.g., '30s', '1m', '5m')
   */
  refresh?: string;

  /**
   * Height of the iframe - use 'fill' to fill remaining viewport space
   * @default 'fill'
   */
  height?: string | 'fill';

  /**
   * Minimum height in pixels
   * @default 500
   */
  minHeight?: number;

  /**
   * Custom CSS classes
   */
  className?: string;

  /**
   * Additional URL parameters
   */
  urlParams?: Record<string, string>;
}

/**
 * GrafanaDashboard Component
 *
 * Usage:
 * ```tsx
 * <GrafanaDashboard
 *   dashboardUid="quest-home-overview"
 *   title="Quest Canada Overview"
 *   kiosk={true}
 * />
 * ```
 */
export function GrafanaDashboard({
  dashboardUid,
  title,
  grafanaUrl = 'https://cpsc405.joeyfishertech.com/grafana',
  kiosk = true,
  timeRange = 'from=now-24h&to=now',
  theme = 'light',
  refresh,
  height = 'fill',
  minHeight = 500,
  className = '',
  urlParams = {}
}: GrafanaDashboardProps) {

  // Build iframe URL
  const buildDashboardUrl = (): string => {
    const baseUrl = `${grafanaUrl}/d/${dashboardUid}`;

    const params: Record<string, string> = {
      orgId: '1',
      autofitpanels: 'true',  // Make panels fit within available space
      ...urlParams
    };

    // Add kiosk mode
    if (kiosk === 'tv') {
      params.kiosk = 'tv';
    } else if (kiosk === true) {
      params.kiosk = '';
    }

    // Add theme
    params.theme = theme;

    // Add refresh
    if (refresh) {
      params.refresh = refresh;
    }

    // Build query string
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}${value ? `=${value}` : ''}`)
      .join('&');

    return `${baseUrl}?${queryString}&${timeRange}`;
  };

  const iframeUrl = buildDashboardUrl();

  // Use CSS calc for fill mode - subtracts approximate header/nav height
  const iframeHeight = height === 'fill'
    ? `max(${minHeight}px, calc(100vh - 280px))`
    : height;

  return (
    <div className={`grafana-dashboard-container ${className}`} style={{ width: '100%', margin: '20px 0' }}>
      {title && (
        <div style={{ marginBottom: '16px', padding: '16px 0', borderBottom: '2px solid #00a9a6' }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '24px', fontWeight: 600 }}>{title}</h2>
        </div>
      )}

      <iframe
        src={iframeUrl}
        width="100%"
        style={{
          height: iframeHeight,
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          display: 'block'
        }}
        title={title || `Grafana Dashboard ${dashboardUid}`}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}

/**
 * Pre-configured dashboard components for common Quest Canada dashboards
 * All use fill height by default to fill available viewport space
 */

export function ProjectFundingDashboard() {
  return (
    <GrafanaDashboard
      dashboardUid="project-funding-simple"
      title="Project Funding Management"
      kiosk={true}
    />
  );
}

export function ProjectMilestoneDashboard() {
  return (
    <GrafanaDashboard
      dashboardUid="project-milestones-simple"
      title="Project Milestone Management"
      kiosk={true}
    />
  );
}

export function BenchmarkStrengthsDashboard() {
  return (
    <GrafanaDashboard
      dashboardUid="benchmark-strengths-simple"
      title="Benchmark Strengths & Recommendations"
      kiosk={true}
    />
  );
}

export function CommunityStakeholderDashboard() {
  return (
    <GrafanaDashboard
      dashboardUid="community-stakeholder-dashboard"
      title="Community Stakeholder Dashboard"
      kiosk={true}
    />
  );
}

export function CitizenEngagementDashboard() {
  return (
    <GrafanaDashboard
      dashboardUid="citizen-engagement-dashboard"
      title="Citizen Engagement Dashboard"
      kiosk={true}
    />
  );
}

export function FunderPolicymakerDashboard() {
  return (
    <GrafanaDashboard
      dashboardUid="funder-policymaker-dashboard"
      title="Funder & Policymaker Dashboard"
      kiosk={true}
    />
  );
}

export default GrafanaDashboard;
