import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Play, Square, Activity, Clock } from 'lucide-react';

const PipelineManagement = () => {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [pipelines, setPipelines] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, healthRes] = await Promise.all([
        axios.get('http://localhost:8000/customers'),
        axios.get('http://localhost:8000/system-health')
      ]);

      setCustomers(customersRes.data);
      
      // Create pipelines object with customer data
      const pipelinesData = {};
      customersRes.data.forEach(customer => {
        const healthData = healthRes.data.find(h => h.customer_id === customer.id);
        pipelinesData[customer.id] = {
          customer,
          is_running: healthData?.pipeline_running || false,
          last_updated: new Date().toISOString(),
          status: healthData?.status || 'unknown'
        };
      });
      
      setPipelines(pipelinesData);
    } catch (error) {
      toast.error('Failed to load pipeline data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePipeline = async (customerId, currentState) => {
    if (!isAdmin()) {
      toast.error('Only admins can control pipelines');
      return;
    }

    setUpdating(prev => ({ ...prev, [customerId]: true }));

    try {
      // First ensure pipeline exists
      await axios.post(`http://localhost:8000/customers/${customerId}/pipeline`);
      
      // Then update the state
      await axios.put(`http://localhost:8000/customers/${customerId}/pipeline`, {
        is_running: !currentState
      });

      setPipelines(prev => ({
        ...prev,
        [customerId]: {
          ...prev[customerId],
          is_running: !currentState,
          last_updated: new Date().toISOString()
        }
      }));

      toast.success(`Pipeline ${!currentState ? 'started' : 'stopped'} successfully!`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update pipeline');
    } finally {
      setUpdating(prev => ({ ...prev, [customerId]: false }));
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        Loading pipelines...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pipeline Management</h1>
        <p className="page-subtitle">Control data pipeline execution for your customers</p>
      </div>

      {!isAdmin() && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fef3c7', 
          color: '#92400e', 
          borderRadius: '0.5rem',
          marginBottom: '2rem'
        }}>
          <strong>Viewer Mode:</strong> You can view pipeline status but cannot control them.
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Pipeline Status ({Object.keys(pipelines).length} customers)
        </h2>

        {Object.keys(pipelines).length > 0 ? (
          <div className="table">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Pipeline</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(pipelines).map(([customerId, pipeline]) => (
                  <tr key={customerId}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '600' }}>{pipeline.customer.name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {pipeline.customer.email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(pipeline.status)}`}>
                        {getStatusText(pipeline.status)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${pipeline.is_running ? 'status-running' : 'status-stopped'}`}>
                        {pipeline.is_running ? 'Running' : 'Stopped'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} />
                        {new Date(pipeline.last_updated).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => togglePipeline(customerId, pipeline.is_running)}
                        disabled={!isAdmin() || updating[customerId]}
                        className={`btn ${pipeline.is_running ? 'btn-danger' : 'btn-success'}`}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          padding: '0.5rem 1rem'
                        }}
                      >
                        {updating[customerId] ? (
                          <Activity size={14} className="animate-spin" />
                        ) : pipeline.is_running ? (
                          <>
                            <Square size={14} />
                            Stop
                          </>
                        ) : (
                          <>
                            <Play size={14} />
                            Start
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No customers found. Add customers first to manage their pipelines.
          </p>
        )}
      </div>

      {/* Pipeline Statistics */}
      {Object.keys(pipelines).length > 0 && (
        <div className="grid grid-cols-3" style={{ marginTop: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Pipeline Statistics
            </h3>
            <div>
              <p><strong>Total Pipelines:</strong> {Object.keys(pipelines).length}</p>
              <p><strong>Running:</strong> {Object.values(pipelines).filter(p => p.is_running).length}</p>
              <p><strong>Stopped:</strong> {Object.values(pipelines).filter(p => !p.is_running).length}</p>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              System Health
            </h3>
            <div>
              <p><strong>Healthy:</strong> {Object.values(pipelines).filter(p => p.status === 'healthy').length}</p>
              <p><strong>Warnings:</strong> {Object.values(pipelines).filter(p => p.status === 'warning').length}</p>
              <p><strong>Errors:</strong> {Object.values(pipelines).filter(p => p.status === 'error').length}</p>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {isAdmin() && (
                <>
                  <button
                    onClick={() => {
                      Object.entries(pipelines).forEach(([customerId, pipeline]) => {
                        if (!pipeline.is_running) {
                          togglePipeline(customerId, false);
                        }
                      });
                    }}
                    className="btn btn-success"
                    style={{ fontSize: '0.875rem' }}
                  >
                    Start All Stopped
                  </button>
                  <button
                    onClick={() => {
                      Object.entries(pipelines).forEach(([customerId, pipeline]) => {
                        if (pipeline.is_running) {
                          togglePipeline(customerId, true);
                        }
                      });
                    }}
                    className="btn btn-danger"
                    style={{ fontSize: '0.875rem' }}
                  >
                    Stop All Running
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineManagement; 