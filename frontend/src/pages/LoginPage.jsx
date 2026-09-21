import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, LogIn, AlertCircle, Key, Mail, Sparkles } from 'lucide-react';

export default function LoginPage({ onNavigateRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (quickEmail) => {
    setEmail(quickEmail);
    setPassword('Pass@123');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '40px 36px',
        border: '1px solid var(--glass-border-peach)'
      }}>
        
        {/* Brand Icon */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #F8DAD0 0%, #E8BCB0 100%)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(232, 188, 176, 0.5)',
            color: '#5C3224'
          }}>
            <Building2 size={32} />
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#3B241D', letterSpacing: '-0.03em' }}>
            Hệ Thống Điều Chuyển
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Đăng nhập để truy cập không gian làm việc theo vai trò
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
            backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)',
            fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          
          <div className="form-group">
            <label className="form-label">Email công vụ</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="name@enterprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Key size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: '12px' }}
          >
            <LogIn size={18} />
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>

        </form>

        {/* Quick Login Section for Testing */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <Sparkles size={14} color="var(--primary-accent)" />
            <span>Tài khoản thử nghiệm nhanh (Mật khẩu: Pass@123):</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => quickFill('employee@enterprise.com')}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 10px', borderRadius: '8px' }}
            >
              👤 Nhân viên
            </button>
            <button
              type="button"
              onClick={() => quickFill('manager@enterprise.com')}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 10px', borderRadius: '8px' }}
            >
              👔 Quản lý
            </button>
            <button
              type="button"
              onClick={() => quickFill('hr@enterprise.com')}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 10px', borderRadius: '8px' }}
            >
              📋 Nhân sự
            </button>
            <button
              type="button"
              onClick={() => quickFill('admin@enterprise.com')}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 10px', borderRadius: '8px' }}
            >
              🏛️ Giám đốc
            </button>
          </div>
        </div>

        {/* Register link */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Chưa có tài khoản? </span>
          <button
            onClick={onNavigateRegister}
            style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', fontWeight: 700, cursor: 'pointer' }}
          >
            Đăng ký ngay
          </button>
        </div>

      </div>
    </div>
  );
}
