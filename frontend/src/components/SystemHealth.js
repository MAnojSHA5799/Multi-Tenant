import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Activity, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const SystemHealth = () => {
  const [healthData, setHealthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      const response = await axios.get('https://multi-tenant-ldn8.onrender.com/system-health');
      setHealthData(response.data);
    } catch (error) {
      toast.error('Failed to load system health data');
      console.error('Error fetching health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchHealthData();
    setRefreshing(false);
    toast.success('Health data refreshed!');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle size={16} color="#059669" />;
      case 'warning':
        return <AlertTriangle size={16} color="#d97706" />;
      case 'error':
        return <XCircle size={16} color="#dc2626" />;
      default:
        return <Activity size={16} color="#6b7280" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'status-healthy';
      case 'warning':
        return 'status-warning';
      case 'error':
        return 'status-error';
      default:
        return 'status-warning';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        Loading system health...
      </div>
    );
  }

  const healthyCount = healthData.filter(h => h.status === 'healthy').length;
  const warningCount = healthData.filter(h => h.status === 'warning').length;
  const errorCount = healthData.filter(h => h.status === 'error').length;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">System Health</h1>
            <p className="page-subtitle">Monitor the health status of all customer systems</p>
          </div>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Health Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <CheckCircle size={24} color="#059669" />
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Healthy</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>{healthyCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AlertTriangle size={24} color="#d97706" />
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Warnings</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706' }}>{warningCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <XCircle size={24} color="#dc2626" />
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Errors</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc2626' }}>{errorCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Activity size={24} color="#3b82f6" />
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>{healthData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Details Table */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          System Health Details
        </h2>

        {healthData.length > 0 ? (
          <div className="table">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Pipeline</th>
                  <th>Last Sync</th>
                  <th>Error Message</th>
                </tr>
              </thead>
              <tbody>
                {healthData.map((health) => (
                  <tr key={health.customer_id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '600' }}>{health.customer_name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          ID: {health.customer_id}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getStatusIcon(health.status)}
                        <span className={`status-badge ${getStatusColor(health.status)}`}>
                          {getStatusText(health.status)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${health.pipeline_running ? 'status-running' : 'status-stopped'}`}>
                        {health.pipeline_running ? 'Running' : 'Stopped'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>
                        {formatTimeAgo(health.last_sync_time)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {new Date(health.last_sync_time).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      {health.last_error_message ? (
                        <div style={{ 
                          maxWidth: '300px', 
                          fontSize: '0.875rem',
                          color: '#dc2626',
                          wordBreak: 'break-word'
                        }}>
                          {health.last_error_message}
                        </div>
                      ) : (
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>No errors</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No health data available. Add customers first to see their system health.
          </p>
        )}
      </div>

      {/* Health Insights */}
      {healthData.length > 0 && (
        <div className="grid grid-cols-2" style={{ marginTop: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
              Health Insights
            </h3>
            <div>
              {errorCount > 0 && (
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#fee2e2', 
                  color: '#991b1b', 
                  borderRadius: '0.375rem',
                  marginBottom: '0.75rem'
                }}>
                  <strong>⚠️ {errorCount} system(s) have errors</strong>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                    These systems require immediate attention.
                  </p>
                </div>
              )}
              
              {warningCount > 0 && (
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#fef3c7', 
                  color: '#92400e', 
                  borderRadius: '0.375rem',
                  marginBottom: '0.75rem'
                }}>
                  <strong>⚠️ {warningCount} system(s) have warnings</strong>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                    These systems should be monitored closely.
                  </p>
                </div>
              )}
              
              {healthyCount > 0 && (
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#dcfce7', 
                  color: '#166534', 
                  borderRadius: '0.375rem'
                }}>
                  <strong>✅ {healthyCount} system(s) are healthy</strong>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                    These systems are operating normally.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
              Recent Activity
            </h3>
            <div>
              {healthData
                .sort((a, b) => new Date(b.last_sync_time) - new Date(a.last_sync_time))
                .slice(0, 5)
                .map((health) => (
                  <div key={health.customer_id} style={{ 
                    padding: '0.5rem 0', 
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '500' }}>{health.customer_name}</span>
                      <span className={`status-badge ${getStatusColor(health.status)}`}>
                        {getStatusText(health.status)}
                      </span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      Last sync: {formatTimeAgo(health.last_sync_time)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealth; 