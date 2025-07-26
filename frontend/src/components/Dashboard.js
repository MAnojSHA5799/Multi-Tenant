import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Users, Database, Activity, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activePipelines: 0,
    healthySystems: 0,
    warnings: 0
  });
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [customersRes, healthRes] = await Promise.all([
        axios.get('https://multi-tenant-ldn8.onrender.com/customers'),
        axios.get('https://multi-tenant-ldn8.onrender.com/system-health')
      ]);

      const customers = customersRes.data;
      const healthData = healthRes.data;

      const activePipelines = healthData.filter(h => h.pipeline_running).length;
      const healthySystems = healthData.filter(h => h.status === 'healthy').length;
      const warnings = healthData.filter(h => h.status === 'warning' || h.status === 'error').length;

      setStats({
        totalCustomers: customers.length,
        activePipelines,
        healthySystems,
        warnings
      });

      setRecentCustomers(customers.slice(-5).reverse());
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        Loading dashboard...
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: '#3b82f6',
      href: '/customers'
    },
    {
      title: 'Active Pipelines',
      value: stats.activePipelines,
      icon: Activity,
      color: '#10b981',
      href: '/pipelines'
    },
    {
      title: 'Healthy Systems',
      value: stats.healthySystems,
      icon: Database,
      color: '#059669',
      href: '/system-health'
    },
    {
      title: 'Warnings',
      value: stats.warnings,
      icon: AlertTriangle,
      color: '#f59e0b',
      href: '/system-health'
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your multi-tenant system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {statCards.map((card, index) => {
    const Icon = card.icon;
    return (
      <Link key={index} to={card.href} style={{ textDecoration: 'none' }}>
        <div
          className="card"
          style={{
            cursor: 'pointer',
            transition: 'transform 0.2s',
            whiteSpace: 'normal', // allow wrapping inside card
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                {card.title}
              </p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
                {card.value}
              </p>
            </div>
            <div
              style={{
                backgroundColor: `${card.color}20`,
                padding: '0.75rem',
                borderRadius: '0.5rem',
              }}
            >
              <Icon size={24} color={card.color} />
            </div>
          </div>
        </div>
      </Link>
    );
  })}
</div>


      {/* Recent Customers */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Recent Customers
        </h2>
        {recentCustomers.length > 0 ? (
          <div className="table">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Timezone</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.timezone}</td>
                    <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No customers found. <Link to="/customers" style={{ color: '#3b82f6' }}>Add your first customer</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 