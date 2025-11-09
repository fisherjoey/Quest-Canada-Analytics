/**
 * Quest Canada - Superset Dashboard React Component
 *
 * Production-ready React component for embedding Apache Superset dashboards
 * with guest token authentication and automatic token refresh.
 *
 * Features:
 * - Guest token authentication
 * - Automatic token refresh (every 4 minutes)
 * - Loading states
 * - Error handling
 * - Customizable UI configuration
 * - TypeScript support (JSDoc types)
 */

import React, { useEffect, useRef, useState } from 'react';
import { embedDashboard } from '@superset-ui/embedded-sdk';
import PropTypes from 'prop-types';
import './SupersetDashboard.css';

/**
 * @typedef {Object} DashboardUiConfig
 * @property {boolean} [hideTitle] - Hide dashboard title
 * @property {boolean} [hideTab] - Hide dashboard tabs
 * @property {boolean} [hideChartControls] - Hide chart control options
 * @property {Object} [filters] - Filter configuration
 * @property {boolean} [filters.visible] - Show/hide filters
 * @property {boolean} [filters.expanded] - Expand filters by default
 * @property {Object} [urlParams] - Query parameters to pass to dashboard
 */

/**
 * SupersetDashboard Component
 *
 * @param {Object} props
 * @param {string} props.dashboardId - UUID of the Superset dashboard
 * @param {string} [props.supersetDomain] - URL of Superset instance
 * @param {string} [props.apiEndpoint] - Backend API endpoint for guest tokens
 * @param {DashboardUiConfig} [props.dashboardUiConfig] - UI configuration
 * @param {string} [props.className] - Custom CSS class
 * @param {Object} [props.style] - Inline styles
 * @param {Function} [props.onLoad] - Callback when dashboard loads
 * @param {Function} [props.onError] - Callback when error occurs
 */
const SupersetDashboard = ({
  dashboardId,
  supersetDomain = process.env.REACT_APP_SUPERSET_URL || 'http://localhost:8088',
  apiEndpoint = '/api/superset/guest-token',
  dashboardUiConfig = {},
  className = '',
  style = {},
  onLoad = null,
  onError = null
}) => {
  // Refs
  const dashboardRef = useRef(null);
  const tokenRefreshIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Constants
  const MAX_RETRIES = 3;
  const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes

  /**
   * Fetch guest token from backend
   * @returns {Promise<string>} Guest token
   */
  const fetchGuestToken = async () => {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if using JWT
          ...(localStorage.getItem('authToken') && {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          })
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          dashboard_id: dashboardId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success || !data.token) {
        throw new Error(data.error || 'Invalid token response');
      }

      return data.token;
    } catch (err) {
      console.error('Guest token fetch error:', err);
      throw err;
    }
  };

  /**
   * Setup token refresh interval
   */
  const setupTokenRefresh = () => {
    // Clear existing interval
    if (tokenRefreshIntervalRef.current) {
      clearInterval(tokenRefreshIntervalRef.current);
    }

    // Set up new interval
    tokenRefreshIntervalRef.current = setInterval(async () => {
      try {
        await fetchGuestToken();
        console.log('Guest token refreshed successfully');
      } catch (err) {
        console.error('Failed to refresh token:', err);
        // Don't show error to user if refresh fails silently
      }
    }, TOKEN_REFRESH_INTERVAL);
  };

  /**
   * Embed the dashboard
   */
  const embedSupersetDashboard = async () => {
    if (!dashboardRef.current || !dashboardId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Default UI configuration
      const defaultConfig = {
        hideTitle: false,
        hideTab: false,
        hideChartControls: false,
        filters: {
          expanded: true,
          visible: true
        }
      };

      // Merge configs
      const finalConfig = {
        ...defaultConfig,
        ...dashboardUiConfig
      };

      // Embed dashboard
      await embedDashboard({
        id: dashboardId,
        supersetDomain: supersetDomain,
        mountPoint: dashboardRef.current,
        fetchGuestToken: fetchGuestToken,
        dashboardUiConfig: finalConfig,
        iframeSandboxExtras: ['allow-top-navigation'],
        referrerPolicy: 'same-origin'
      });

      if (isMountedRef.current) {
        setLoading(false);
        setRetryCount(0);

        // Setup token refresh
        setupTokenRefresh();

        // Call onLoad callback
        if (onLoad) {
          onLoad();
        }
      }
    } catch (err) {
      console.error('Dashboard embedding error:', err);

      if (isMountedRef.current) {
        const errorMessage = err.message || 'Failed to load dashboard';
        setError(errorMessage);
        setLoading(false);

        // Call onError callback
        if (onError) {
          onError(err);
        }
      }
    }
  };

  /**
   * Retry loading dashboard
   */
  const handleRetry = () => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount(retryCount + 1);
      embedSupersetDashboard();
    } else {
      setError('Maximum retry attempts reached. Please refresh the page.');
    }
  };

  /**
   * Effect: Embed dashboard on mount
   */
  useEffect(() => {
    isMountedRef.current = true;
    embedSupersetDashboard();

    // Cleanup
    return () => {
      isMountedRef.current = false;

      // Clear token refresh interval
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
    };
  }, [dashboardId, supersetDomain]);

  return (
    <div
      className={`superset-dashboard-container ${className}`}
      style={style}
    >
      {loading && (
        <div className="superset-loading">
          <div className="spinner" />
          <p>Loading dashboard...</p>
          {retryCount > 0 && (
            <p className="retry-info">Retry attempt {retryCount}/{MAX_RETRIES}</p>
          )}
        </div>
      )}

      {error && (
        <div className="superset-error">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Dashboard</h3>
          <p className="error-message">{error}</p>
          {retryCount < MAX_RETRIES ? (
            <button
              className="retry-button"
              onClick={handleRetry}
            >
              Retry ({MAX_RETRIES - retryCount} attempts remaining)
            </button>
          ) : (
            <button
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          )}
        </div>
      )}

      <div
        ref={dashboardRef}
        className="superset-dashboard-iframe"
        style={{ display: loading || error ? 'none' : 'block' }}
      />
    </div>
  );
};

SupersetDashboard.propTypes = {
  dashboardId: PropTypes.string.isRequired,
  supersetDomain: PropTypes.string,
  apiEndpoint: PropTypes.string,
  dashboardUiConfig: PropTypes.shape({
    hideTitle: PropTypes.bool,
    hideTab: PropTypes.bool,
    hideChartControls: PropTypes.bool,
    filters: PropTypes.shape({
      visible: PropTypes.bool,
      expanded: PropTypes.bool
    }),
    urlParams: PropTypes.object
  }),
  className: PropTypes.string,
  style: PropTypes.object,
  onLoad: PropTypes.func,
  onError: PropTypes.func
};

export default SupersetDashboard;

/**
 * Example Usage:
 *
 * import SupersetDashboard from './components/SupersetDashboard';
 *
 * function App() {
 *   return (
 *     <div style={{ height: '800px' }}>
 *       <SupersetDashboard
 *         dashboardId="abc123-uuid-from-superset"
 *         supersetDomain="http://localhost:8088"
 *         dashboardUiConfig={{
 *           hideTitle: false,
 *           filters: { expanded: true }
 *         }}
 *         onLoad={() => console.log('Dashboard loaded')}
 *         onError={(err) => console.error('Dashboard error:', err)}
 *       />
 *     </div>
 *   );
 * }
 */
