import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UserPlus, Edit, Trash2, Shield, Eye, Save, X } from 'lucide-react';

const UserManagement = () => {
  const { isAdmin, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'viewer'
  });

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      if (editingUser) {
        // Update existing user
        await axios.put(
          `http://localhost:8000/users/${editingUser.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success('User updated successfully!');
        setEditingUser(null);
      } else {
        // Create new user
        await axios.post(
          'http://localhost:8000/users',
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        toast.success('User created successfully!');
      }
      
      setFormData({ email: '', password: '', role: 'viewer' });
      setShowForm(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '', // Don't populate password for security
      role: user.role
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', role: 'viewer' });
    setShowForm(false);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield size={16} color="#dc2626" />;
      case 'viewer':
        return <Eye size={16} color="#6b7280" />;
      default:
        return <UserPlus size={16} color="#3b82f6" />;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="status-badge status-error">Admin</span>;
      case 'viewer':
        return <span className="status-badge status-warning">Viewer</span>;
      default:
        return <span className="status-badge">Unknown</span>;
    }
  };

  if (!isAdmin()) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <Shield size={64} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
          Access Denied
        </h1>
        <p style={{ color: '#6b7280', maxWidth: '400px', margin: '0 auto' }}>
          User management is restricted to administrators only. Please contact your system administrator for access.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        Loading users...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">Manage users and their roles in the system</p>
      </div>

      {/* Add User Button */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <UserPlus size={16} />
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {/* Add/Edit User Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            {editingUser ? 'Edit User' : 'Add New User'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="user@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Password {editingUser && <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                  placeholder={editingUser ? "Enter new password (optional)" : "Enter password"}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                name="role"
                className="form-input"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                <strong>Viewer:</strong> Can view data but cannot modify settings<br />
                <strong>Admin:</strong> Full access to all features and settings
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {editingUser ? <Save size={16} /> : <UserPlus size={16} />}
                {editingUser ? 'Update User' : 'Create User'}
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

      {/* Users Table */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          All Users ({users.length})
        </h2>
        
        {users.length > 0 ? (
          <div className="table">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getRoleIcon(user.role)}
                        <div>
                          <div style={{ fontWeight: '600' }}>{user.email}</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {getRoleBadge(user.role)}
                    </td>
                    <td>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {new Date(user.updated_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(user)}
                          className="btn"
                          style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                          title="Edit User"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn btn-danger"
                          style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No users found. Add your first user to get started.
          </p>
        )}
      </div>

      {/* Role Information */}
      <div className="grid grid-cols-2" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
            Role Permissions
          </h3>
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                <Shield size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Admin
              </h4>
              <ul style={{ fontSize: '0.875rem', color: '#6b7280', paddingLeft: '1.5rem' }}>
                <li>Create and manage customers</li>
                <li>Configure source connections</li>
                <li>Control pipeline execution</li>
                <li>Manage users and roles</li>
                <li>View system health</li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                <Eye size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Viewer
              </h4>
              <ul style={{ fontSize: '0.875rem', color: '#6b7280', paddingLeft: '1.5rem' }}>
                <li>View customer information</li>
                <li>View source configurations</li>
                <li>View pipeline status</li>
                <li>View system health</li>
                <li>Cannot modify any settings</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
            User Statistics
          </h3>
          <div>
            <p><strong>Total Users:</strong> {users.length}</p>
            <p><strong>Admins:</strong> {users.filter(u => u.role === 'admin').length}</p>
            <p><strong>Viewers:</strong> {users.filter(u => u.role === 'viewer').length}</p>
          </div>
          
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Security Notes
            </h4>
            <ul style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              <li>Passwords are securely hashed</li>
              <li>JWT tokens expire after 24 hours</li>
              <li>Role-based access control enforced</li>
              <li>All actions are logged</li>
              <li>Cannot delete the last admin user</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 