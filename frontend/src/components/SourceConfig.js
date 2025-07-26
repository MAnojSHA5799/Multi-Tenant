import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Database, Eye, EyeOff, Save } from 'lucide-react';

const SourceConfig = () => {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    db_host: '',
    db_port: 5432,
    db_username: '',
    db_password: '',
    db_name: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchConfig(selectedCustomer);
    } else {
      setConfig(null);
      setFormData({
        db_host: '',
        db_port: 5432,
        db_username: '',
        db_password: '',
        db_name: ''
      });
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('https://multi-tenant-ldn8.onrender.com/customers');
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to load customers');
    }
  };

  const fetchConfig = async (customerId) => {
    try {
      const response = await axios.get(`https://multi-tenant-ldn8.onrender.com/customers/${customerId}/source-config`);
      setConfig(response.data);
      setFormData({
        db_host: response.data.db_host,
        db_port: response.data.db_port,
        db_username: response.data.db_username,
        db_password: response.data.db_password,
        db_name: response.data.db_name
      });
    } catch (error) {
      if (error.response?.status === 404) {
        setConfig(null);
        setFormData({
          db_host: '',
          db_port: 5432,
          db_username: '',
          db_password: '',
          db_name: ''
        });
      } else {
        toast.error('Failed to load configuration');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error('Please select a customer first');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`https://multi-tenant-ldn8.onrender.com/customers/${selectedCustomer}/source-config`, formData);
      toast.success('Configuration saved successfully!');
      fetchConfig(selectedCustomer);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const maskPassword = (password) => {
    return password ? '•'.repeat(password.length) : '';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Source Configuration</h1>
        <p className="page-subtitle">Configure database connections for your customers</p>
      </div>

      <div className="grid grid-cols-2">
        {/* Customer Selection */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Select Customer
          </h2>
          
          <div className="form-group">
            <label className="form-label">Customer</label>
            <select
              className="form-input"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              <option value="">Choose a customer...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
          </div>

          {selectedCustomer && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Customer Details
              </h3>
              {(() => {
                const customer = customers.find(c => c.id == selectedCustomer);
                return customer ? (
                  <div>
                    <p><strong>Name:</strong> {customer.name}</p>
                    <p><strong>Email:</strong> {customer.email}</p>
                    <p><strong>Timezone:</strong> {customer.timezone}</p>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Configuration Form */}
        {selectedCustomer && (
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Database Configuration
              {config && <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '400' }}> (Existing)</span>}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Database Host</label>
                  <input
                    type="text"
                    name="db_host"
                    className="form-input"
                    value={formData.db_host}
                    onChange={handleInputChange}
                    required
                    placeholder="localhost"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Database Port</label>
                  <input
                    type="number"
                    name="db_port"
                    className="form-input"
                    value={formData.db_port}
                    onChange={handleInputChange}
                    required
                    placeholder="5432"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Database Username</label>
                  <input
                    type="text"
                    name="db_username"
                    className="form-input"
                    value={formData.db_username}
                    onChange={handleInputChange}
                    required
                    placeholder="username"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Database Name</label>
                  <input
                    type="text"
                    name="db_name"
                    className="form-input"
                    value={formData.db_name}
                    onChange={handleInputChange}
                    required
                    placeholder="database_name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Database Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="db_password"
                    className="form-input"
                    value={formData.db_password}
                    onChange={handleInputChange}
                    required
                    placeholder="password"
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {!isAdmin() && (
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#fef3c7', 
                  color: '#92400e', 
                  borderRadius: '0.375rem',
                  marginBottom: '1rem'
                }}>
                  <strong>Viewer Mode:</strong> You can view configurations but cannot modify them.
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!isAdmin() || loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Configuration Display */}
      {config && (
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Current Configuration
          </h2>
          <div className="grid grid-cols-2">
            <div>
              <p><strong>Host:</strong> {config.db_host}</p>
              <p><strong>Port:</strong> {config.db_port}</p>
              <p><strong>Username:</strong> {config.db_username}</p>
            </div>
            <div>
              <p><strong>Database:</strong> {config.db_name}</p>
              <p><strong>Password:</strong> {maskPassword(config.db_password)}</p>
              <p><strong>Last Updated:</strong> {new Date(config.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceConfig; 