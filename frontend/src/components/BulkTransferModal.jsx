import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { X, Users, Send, AlertCircle } from 'lucide-react';

export default function BulkTransferModal({ isOpen, onClose, onSuccess }) {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [toDepartmentId, setToDepartmentId] = useState('');
  const [toPositionId, setToPositionId] = useState('');
  const [toManagerId, setToManagerId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setSelectedEmpIds([]);
      setError('');
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [empRes, deptRes, posRes] = await Promise.all([
        api.get('/employees'),
        api.get('/departments'),
        api.get('/positions')
      ]);
      if (empRes.data.success) setEmployees(empRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (posRes.data.success) setPositions(posRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const toggleEmp = (id) => {
    setSelectedEmpIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredPositions = positions.filter(p => p.departmentId === Number(toDepartmentId));
  const managers = employees.filter(e => e.role === 'manager' || e.role === 'admin');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedEmpIds.length === 0) {
      setError('Vui lòng chọn ít nhất một nhân sự để điều chuyển hàng loạt.');
      return;
    }
    if (!toDepartmentId || !toPositionId || !effectiveDate || !reason) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        employeeIds: selectedEmpIds,
        toDepartmentId: Number(toDepartmentId),
        toPositionId: Number(toPositionId),
        toManagerId: toManagerId ? Number(toManagerId) : null,
        effectiveDate,
        reason,
        notes,
        transferType: 'BulkTransfer'
      };

      const res = await api.post('/transfers/bulk', payload);
      if (res.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi thực hiện điều chuyển hàng loạt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '720px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#3B241D', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={22} color="var(--primary-accent)" />
              Điều Chuyển Nhân Sự Hàng Loạt (Bulk Transfer)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Áp dụng cho trường hợp sáp nhập, tái cấu trúc đội ngũ phòng ban
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={22} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
            backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)',
            fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {/* Employee Selection List */}
          <div className="form-group">
            <label className="form-label">Chọn danh sách nhân sự tham gia ({selectedEmpIds.length} đã chọn) *</label>
            <div style={{
              maxHeight: '160px', overflowY: 'auto', padding: '10px',
              borderRadius: '10px', border: '1px solid rgba(200, 185, 180, 0.5)',
              background: 'rgba(255, 255, 255, 0.7)'
            }}>
              {employees.map(emp => (
                <label
                  key={emp.employeeId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px',
                    borderRadius: '6px', cursor: 'pointer',
                    background: selectedEmpIds.includes(emp.employeeId) ? 'rgba(248, 218, 208, 0.35)' : 'transparent'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedEmpIds.includes(emp.employeeId)}
                    onChange={() => toggleEmp(emp.employeeId)}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{emp.fullName}</span>
                  <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    ({emp.employeeCode} • {emp.departmentName} • {emp.positionName})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Target Dept & Position */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Phòng ban tiếp nhận chung *</label>
              <select
                className="form-select"
                value={toDepartmentId}
                onChange={(e) => {
                  setToDepartmentId(e.target.value);
                  setToPositionId('');
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
              <label className="form-label">Chức danh tiếp nhận chung *</label>
              <select
                className="form-select"
                value={toPositionId}
                onChange={(e) => setToPositionId(e.target.value)}
                required
                disabled={!toDepartmentId}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Quản lý tiếp nhận</label>
              <select
                className="form-select"
                value={toManagerId}
                onChange={(e) => setToManagerId(e.target.value)}
              >
                <option value="">-- Quản lý tiếp nhận --</option>
                {managers.map(m => (
                  <option key={m.employeeId} value={m.employeeId}>{m.fullName} ({m.departmentName})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ngày hiệu lực *</label>
              <input
                type="date"
                className="form-input"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Lý do tái cấu trúc / điều chuyển *</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Quyết định sáp nhập hoặc tái định hình cơ cấu phòng ban..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="btn btn-accent">
              <Send size={16} />
              {loading ? 'Đang thực hiện...' : `Thi Hành Điều Chuyển (${selectedEmpIds.length} nhân sự)`}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
