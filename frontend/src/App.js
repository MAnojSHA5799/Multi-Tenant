import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerOnboarding from './components/CustomerOnboarding';
import SourceConfig from './components/SourceConfig';
import PipelineManagement from './components/PipelineManagement';
import SystemHealth from './components/SystemHealth';
import UserManagement from './components/UserManagement';
import Layout from './components/Layout';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<CustomerOnboarding />} />
        <Route path="/source-config" element={<SourceConfig />} />
        <Route path="/pipelines" element={<PipelineManagement />} />
        <Route path="/system-health" element={<SystemHealth />} />
        <Route path="/users" element={<UserManagement />} />
      </Routes>
    </Layout>
  );
}

export default App; 