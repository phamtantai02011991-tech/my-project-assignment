import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Building2, UserPlus, AlertCircle, ArrowLeft } from 'lucide-react';

export default function RegisterPage({ onNavigateLogin }) {
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [departmentId, setDepartmentId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [phone, setPhone] = useState('');

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [dRes, pRes] = await Promise.all([
        api.get('/departments'),
        api.get('/positions')
      ]);
      if (dRes.data.success) setDepartments(dRes.data.data);
      if (pRes.data.success) setPositions(pRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!departmentId || !positionId) {
      setError('Vui lòng chọn phòng ban và chức danh.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await register({
        fullName,
        email,
        password,
        role,
        departmentId: Number(departmentId),
        positionId: Number(positionId),
        phone
      });
    } catch (err) {
      setError(err.message || 'Đăng ký không thành công.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPositions = positions.filter(p => p.departmentId === Number(departmentId));

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '36px',
        border: '1px solid var(--glass-border-peach)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '54px', height: '54px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #F8DAD0 0%, #E8BCB0 100%)',
            margin: '0 auto 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#5C3224'
          }}>
            <UserPlus size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3B241D' }}>
            Đăng Ký Tài Khoản Mới
          </h2>
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

        <form onSubmit={handleRegister}>
          
          <div className="form-group">
            <label className="form-label">Họ và tên *</label>
            <input
              type="text"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu *</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Vai trò RBAC *</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="employee">Nhân viên (Employee)</option>
                <option value="manager">Quản lý (Manager)</option>
                <option value="hr">Nhân sự (HR)</option>
                <option value="admin">Ban Giám Đốc (Admin)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Phòng ban ban đầu *</label>
              <select
                className="form-select"
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setPositionId('');
                }}
                required
              >
                <option value="">-- Chọn phòng ban --</option>
                {departments.map(d => (
                  <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Chức danh ban đầu *</label>
              <select
                className="form-select"
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
                required
                disabled={!departmentId}
              >
                <option value="">-- Chọn chức danh --</option>
                {filteredPositions.map(p => (
                  <option key={p.PositionId || p.positionId} value={p.PositionId || p.positionId}>
                    {p.PositionName || p.positionName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: '16px' }}
          >
            {loading ? 'Đang tạo...' : 'Đăng Ký & Đăng Nhập'}
          </button>

        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={onNavigateLogin}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} />
            Quay lại Đăng Nhập
          </button>
        </div>

      </div>
    </div>
  );
}
