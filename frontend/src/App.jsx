import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import HrDashboard from './pages/HrDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const { user, isAuthenticated, loading } = useAuth();
  const [isRegisterView, setIsRegisterView] = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.1rem',
        fontWeight: 600,
        color: '#5C3224'
      }}>
        <div className="glass-panel" style={{ padding: '24px 40px' }}>
          Đang khởi tạo hệ thống Workflow...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isRegisterView) {
      return <RegisterPage onNavigateLogin={() => setIsRegisterView(false)} />;
    }
    return <LoginPage onNavigateRegister={() => setIsRegisterView(true)} />;
  }

  // Strict JWT RBAC Routing - Each role has dedicated workspace
  switch (user.role) {
    case 'manager':
      return <ManagerDashboard />;
    case 'hr':
      return <HrDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'employee':
    default:
      return <EmployeeDashboard />;
  }
}
