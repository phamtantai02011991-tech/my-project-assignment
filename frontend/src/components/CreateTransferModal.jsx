import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { X, Send, AlertCircle, Building2, Briefcase, Calendar, FileText } from 'lucide-react';

export default function CreateTransferModal({ isOpen, onClose, onSuccess, targetEmployee = null }) {
  const { user } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [selectedEmpId, setSelectedEmpId] = useState(targetEmployee?.employeeId || user?.employeeId || '');
  const [toDepartmentId, setToDepartmentId] = useState('');
  const [toPositionId, setToPositionId] = useState('');
  const [toManagerId, setToManagerId] = useState('');
  const [transferType, setTransferType] = useState('EmployeeRequested');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [keepPosition, setKeepPosition] = useState(false);
  const [requireConsent, setRequireConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
      setError('');
      if (user?.role === 'employee') {
        setSelectedEmpId(user.employeeId);
        setTransferType('EmployeeRequested');
      } else if (user?.role === 'manager') {
        setTransferType('ManagerInitiated');
      } else if (user?.role === 'hr' || user?.role === 'admin') {
        setTransferType('HrInitiated');
      }
    }
  }, [isOpen]);

  const fetchMetadata = async () => {
    try {
      const [deptRes, posRes, empRes] = await Promise.all([
        api.get('/departments'),
        api.get('/positions'),
        api.get('/employees')
      ]);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (posRes.data.success) setPositions(posRes.data.data);
      if (empRes.data.success) setEmployees(empRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const currentEmp = employees.find(e => e.employeeId === Number(selectedEmpId)) || user;
  const filteredPositions = keepPosition
    ? positions
    : positions.filter(p => p.departmentId === Number(toDepartmentId));

  const managers = employees.filter(e => e.role === 'manager' || e.role === 'admin');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!toDepartmentId) {
      setError('Vui lòng chọn phòng ban tiếp nhận.');
      return;
    }
    if (!toPositionId) {
      setError('Vui lòng chọn chức danh tiếp nhận.');
      return;
    }
    if (!effectiveDate) {
      setError('Vui lòng chọn ngày có hiệu lực.');
      return;
    }
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do điều chuyển.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        employeeId: Number(selectedEmpId),
        toDepartmentId: Number(toDepartmentId),
        toPositionId: Number(toPositionId),
        toManagerId: toManagerId ? Number(toManagerId) : null,
        transferType,
        effectiveDate,
        returnDate: returnDate || null,
        reason,
        notes,
        keepPosition,
        requireEmployeeConsent: requireConsent
      };

      const res = await api.post('/transfers', payload);
      if (res.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tạo hồ sơ điều chuyển');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '680px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#3B241D' }}>Tạo Đơn Điều Chuyển Nhân Sự</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Khởi tạo quy trình xét duyệt theo chuẩn Transfer Workflow
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
          
          {/* Target Employee Selection */}
          {user?.role !== 'employee' ? (
            <div className="form-group">
              <label className="form-label">Chọn nhân sự điều chuyển *</label>
              <select
                className="form-select"
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                required
              >
                <option value="">-- Chọn nhân viên --</option>
                {employees.map(emp => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.fullName} ({emp.employeeCode}) - {emp.departmentName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{
              padding: '12px 16px', borderRadius: '10px',
              background: 'rgba(248, 218, 208, 0.25)', marginBottom: '16px',
              fontSize: '0.875rem'
            }}>
              <strong>Nhân sự:</strong> {user?.fullName} ({user?.employeeCode})<br />
              <strong>Phòng ban hiện tại:</strong> {user?.departmentName} • <strong>Chức vụ:</strong> {user?.positionName}
            </div>
          )}

          {/* Transfer Type Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Loại điều chuyển</label>
              <select
                className="form-select"
                value={transferType}
                onChange={(e) => setTransferType(e.target.value)}
              >
                <option value="EmployeeRequested">Nhân viên tự nguyện xin chuyển</option>
                <option value="ManagerInitiated">Quản lý chủ động đề xuất</option>
                <option value="HrInitiated">Nhân sự điều động</option>
                <option value="ManagementDirected">Lệnh điều hành Ban Giám Đốc</option>
                <option value="Temporary">Biệt phái tạm thời (Temporary)</option>
                <option value="Permanent">Điều chuyển chính thức (Permanent)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phòng ban tiếp nhận *</label>
              <select
                className="form-select"
                value={toDepartmentId}
                onChange={(e) => {
                  setToDepartmentId(e.target.value);
                  setToPositionId('');
                }}
                required
              >
                <option value="">-- Chọn phòng ban đến --</option>
                {departments
                  .filter(d => d.departmentId !== currentEmp?.departmentId)
                  .map(d => (
                    <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Target Position & Target Manager */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Vị trí / Chức danh mới *</label>
              <select
                className="form-select"
                value={toPositionId}
                onChange={(e) => setToPositionId(e.target.value)}
                required
                disabled={!toDepartmentId && !keepPosition}
              >
                <option value="">-- Chọn chức danh mới --</option>
                {filteredPositions.map(p => (
                  <option key={p.PositionId || p.positionId} value={p.PositionId || p.positionId}>
                    {p.PositionName || p.positionName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quản lý tiếp nhận trực tiếp</label>
              <select
                className="form-select"
                value={toManagerId}
                onChange={(e) => setToManagerId(e.target.value)}
              >
                <option value="">-- Chọn người quản lý (Tùy chọn) --</option>
                {managers.map(m => (
                  <option key={m.employeeId} value={m.employeeId}>
                    {m.fullName} ({m.departmentName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: transferType === 'Temporary' ? '1fr 1fr' : '1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Ngày bắt đầu có hiệu lực *</label>
              <input
                type="date"
                className="form-input"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                required
              />
            </div>

            {transferType === 'Temporary' && (
              <div className="form-group">
                <label className="form-label">Ngày kết thúc biệt phái (Return Date)</label>
                <input
                  type="date"
                  className="form-input"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Checkbox Options */}
          <div style={{ display: 'flex', gap: '20px', margin: '8px 0 16px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={keepPosition}
                onChange={(e) => setKeepPosition(e.target.checked)}
              />
              Giữ nguyên chức danh tương đương
            </label>

            {user?.role !== 'employee' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={requireConsent}
                  onChange={(e) => setRequireConsent(e.target.checked)}
                />
                Yêu cầu nhân viên xác nhận trước khi phê duyệt
              </label>
            )}
          </div>

          {/* Reason & Notes */}
          <div className="form-group">
            <label className="form-label">Lý do điều chuyển *</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Nêu rõ lý do, kế hoạch công tác hoặc mục tiêu phát triển..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ghi chú bổ sung</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ghi chú bàn giao công việc, điều kiện hỗ trợ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="btn btn-accent">
              <Send size={16} />
              {loading ? 'Đang gửi...' : 'Gửi Yêu Cầu Điều Chuyển'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
