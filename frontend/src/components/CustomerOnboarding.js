import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

const CustomerOnboarding = () => {
  const { isAdmin, token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    timezone: 'UTC'
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/customers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to load customers');
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCustomer) {
        // Update existing customer
        await axios.put(`http://localhost:8000/customers/${editingCustomer.id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success('Customer updated successfully!');
        setEditingCustomer(null);
      } else {
        // Create new customer
        await axios.post('http://localhost:8000/customers', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success('Customer created successfully!');
      }
      
      setFormData({ name: '', email: '', timezone: 'UTC' });
      setShowForm(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save customer');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      timezone: customer.timezone
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingCustomer(null);
    setFormData({ name: '', email: '', timezone: 'UTC' });
    setShowForm(false);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Customer deleted successfully!');
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete customer');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        Loading customers...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customer Management</h1>
        <p className="page-subtitle">Onboard and manage your customers</p>
      </div>

      {/* Add Customer Button */}
      {isAdmin() && (
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} />
            {showForm ? 'Cancel' : 'Add Customer'}
          </button>
        </div>
      )}

      {/* Add/Edit Customer Form */}
      {showForm && isAdmin() && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter customer name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter customer email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select
                name="timezone"
                className="form-input"
                value={formData.timezone}
                onChange={handleInputChange}
                required
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Shanghai">Shanghai</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {editingCustomer ? <Save size={16} /> : <Plus size={16} />}
                {editingCustomer ? 'Update Customer' : 'Create Customer'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customers Table */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          All Customers ({customers.length})
        </h2>
        
        {customers.length > 0 ? (
          <div className="table">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Timezone</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.timezone}</td>
                    <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isAdmin() && (
                          <button
                            onClick={() => handleEdit(customer)}
                            className="btn"
                            style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        {isAdmin() && (
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="btn btn-danger"
                            style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No customers found. {isAdmin() && 'Add your first customer to get started.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default CustomerOnboarding; 