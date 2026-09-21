import React, { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import TransferTimeline from './TransferTimeline';
import { X, CheckCircle, XCircle, RotateCcw, Ban, Edit3, ArrowRight, ShieldCheck } from 'lucide-react';

export default function TransferDetailModal({ transfer, isOpen, onClose, onActionSuccess, onOpenResubmit }) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [activeAction, setActiveAction] = useState(null); // 'REJECT', 'REQUEST_INFO', 'REVOKE', 'CONSENT_DECLINE'

  if (!isOpen || !transfer) return null;

  const handleDecision = async (actionType) => {
    if ((actionType === 'REJECT' || actionType === 'REQUEST_INFO') && !comment.trim()) {
      setActionError('Hành động này bắt buộc phải nhập lý do/nội dung.');
      return;
    }

    setLoading(true);
    setActionError('');
    try {
      const res = await api.post(`/transfers/${transfer.transferId}/decision`, {
        action: actionType,
        comment: comment || 'Đã đồng ý phê duyệt'
      });
      if (res.data.success) {
        onActionSuccess();
        onClose();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Lỗi khi xử lý phê duyệt');
    } finally {
      setLoading(false);
    }
  };

  const handleConsent = async (consentType) => {
    if (consentType === 'DECLINE' && !comment.trim()) {
      setActionError('Từ chối tiếp nhận bắt buộc phải nhập lý do.');
      return;
    }

    setLoading(true);
    setActionError('');
    try {
      const res = await api.post(`/transfers/${transfer.transferId}/consent`, {
        consent: consentType,
        comment: comment || 'Nhân viên đồng thuận'
      });
      if (res.data.success) {
        onActionSuccess();
        onClose();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Lỗi khi phản hồi');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy hồ sơ này không?')) return;
    setLoading(true);
    try {
      const res = await api.put(`/transfers/${transfer.transferId}/cancel`, null, {
        params: { reason: comment || 'Người tạo chủ động hủy đơn' }
      });
      if (res.data.success) {
        onActionSuccess();
        onClose();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeScheduled = async () => {
    if (!comment.trim()) {
      setActionError('Thu hồi quyết định đã duyệt bắt buộc phải có lý do.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.put(`/transfers/${transfer.transferId}/cancel-approved`, null, {
        params: { reason: comment }
      });
      if (res.data.success) {
        onActionSuccess();
        onClose();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const isEmployeeOwner = user?.employeeId === transfer.employeeId;
  const isPending = transfer.status === 'PendingApproval';
  const isManager = user?.role === 'manager';
  const isHrOrAdmin = user?.role === 'hr' || user?.role === 'admin';

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '780px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '1.35rem', color: '#3B241D' }}>{transfer.transferCode}</h3>
              <StatusBadge status={transfer.status} />
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Khởi tạo ngày {transfer.createdAt} bởi vai trò <strong>{transfer.initiatorRole}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        {/* Visual Timeline */}
        <TransferTimeline
          status={transfer.status}
          approvals={transfer.approvals || []}
          effectiveDate={transfer.effectiveDate}
        />

        {/* Transfer Details Card */}
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', background: 'rgba(255, 255, 255, 0.85)' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(0, 0, 0, 0.02)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hiện Tại</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>{transfer.fromDepartmentName}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{transfer.fromPositionName}</div>
              {transfer.fromManagerName && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Quản lý: {transfer.fromManagerName}</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-peach)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowRight size={18} color="#5C3224" />
              </div>
            </div>

            <div style={{ padding: '12px', background: 'rgba(248, 218, 208, 0.25)', borderRadius: '10px', border: '1px solid var(--glass-border-peach)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-accent)', textTransform: 'uppercase' }}>Chuyển Đến</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>{transfer.toDepartmentName}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{transfer.toPositionName}</div>
              {transfer.toManagerName && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Quản lý: {transfer.toManagerName}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
            <div>
              <strong>Nhân sự:</strong> {transfer.employeeName} ({transfer.employeeCode})
            </div>
            <div>
              <strong>Loại điều chuyển:</strong> {transfer.transferType}
            </div>
            <div>
              <strong>Ngày hiệu lực:</strong> {transfer.effectiveDate}
            </div>
            {transfer.returnDate && (
              <div>
                <strong>Ngày hoàn trả (Return):</strong> {transfer.returnDate}
              </div>
            )}
            {transfer.batchCode && (
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Mã lô điều chuyển (Batch):</strong> {transfer.batchCode}
              </div>
            )}
            <div style={{ gridColumn: 'span 2', marginTop: '6px' }}>
              <strong>Lý do:</strong> {transfer.reason}
            </div>
            {transfer.notes && (
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Ghi chú:</strong> {transfer.notes}
              </div>
            )}
            {transfer.consentComment && (
              <div style={{ gridColumn: 'span 2', color: transfer.employeeConsent === 'Declined' ? '#DC2626' : '#198754' }}>
                <strong>Phản hồi của nhân viên ({transfer.employeeConsent}):</strong> {transfer.consentComment}
              </div>
            )}
          </div>

        </div>

        {/* Approval Records Table */}
        {transfer.approvals && transfer.approvals.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>Nhật Ký Xét Duyệt</h4>
            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
              <table className="data-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Cấp</th>
                    <th>Người Phê Duyệt</th>
                    <th>Vai Trò</th>
                    <th>Trạng Thái</th>
                    <th>Ý Kiến / Ghi Chú</th>
                    <th>Thời Gian</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.approvals.map(a => (
                    <tr key={a.approvalId}>
                      <td>L{a.approvalLevel}</td>
                      <td><strong>{a.approverName}</strong></td>
                      <td>{a.approverRole}</td>
                      <td>
                        <span className={`badge ${a.status === 'Approved' ? 'badge-completed' : a.status === 'Rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td>{a.comment || '—'}</td>
                      <td>{a.actionDate || 'Chờ xử lý'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {actionError && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px', marginBottom: '14px',
            backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)',
            fontSize: '0.85rem'
          }}>
            {actionError}
          </div>
        )}

        {/* Action Comment Input (if activeAction requires) */}
        {activeAction && (
          <div style={{ padding: '14px', background: 'rgba(248, 218, 208, 0.2)', borderRadius: '10px', marginBottom: '16px' }}>
            <label className="form-label">
              {activeAction === 'REJECT' ? 'Lý do từ chối (Bắt buộc) *' :
               activeAction === 'REQUEST_INFO' ? 'Nội dung cần yêu cầu bổ sung (Bắt buộc) *' :
               activeAction === 'REVOKE' ? 'Lý do thu hồi quyết định (Bắt buộc) *' :
               'Lý do từ chối tiếp nhận (Bắt buộc) *'}
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Nhập chi tiết ý kiến xử lý..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>
        )}

        {/* Action Buttons Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '16px' }}>
          
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Đóng
          </button>

          {/* Employee Consent Actions */}
          {transfer.status === 'PendingEmployeeResponse' && isEmployeeOwner && (
            <>
              {activeAction === 'CONSENT_DECLINE' ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleConsent('DECLINE')}
                  className="btn btn-danger"
                >
                  Xác nhận Từ Chối
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveAction('CONSENT_DECLINE')}
                  className="btn btn-danger"
                >
                  <XCircle size={16} />
                  Từ Chối Tiếp Nhận
                </button>
              )}

              <button
                type="button"
                disabled={loading}
                onClick={() => handleConsent('ACCEPT')}
                className="btn btn-success"
              >
                <CheckCircle size={16} />
                Đồng Ý Nhận Quyết Định
              </button>
            </>
          )}

          {/* NeedMoreInformation Resubmit Action */}
          {transfer.status === 'NeedMoreInformation' && (isEmployeeOwner || transfer.initiatorId === user?.employeeId) && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenResubmit(transfer);
              }}
              className="btn btn-accent"
            >
              <Edit3 size={16} />
              Bổ Sung Thông Tin & Gửi Lại
            </button>
          )}

          {/* Cancel Pending Request */}
          {isPending && (isEmployeeOwner || isHrOrAdmin) && (
            <button
              type="button"
              disabled={loading}
              onClick={handleCancel}
              className="btn btn-secondary"
              style={{ color: '#DC2626' }}
            >
              <Ban size={16} />
              Hủy Đơn
            </button>
          )}

          {/* Approver Actions (Manager / HR / Admin) */}
          {isPending && (isManager || isHrOrAdmin) && (
            <>
              {activeAction === 'REQUEST_INFO' ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDecision('REQUEST_INFO')}
                  className="btn btn-secondary"
                  style={{ color: '#C2410C' }}
                >
                  Gửi Yêu Cầu Bổ Sung
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveAction('REQUEST_INFO')}
                  className="btn btn-secondary"
                  style={{ color: '#C2410C' }}
                >
                  <RotateCcw size={16} />
                  Yêu Cầu Bổ Sung
                </button>
              )}

              {activeAction === 'REJECT' ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleDecision('REJECT')}
                  className="btn btn-danger"
                >
                  Xác Nhận Từ Chối
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveAction('REJECT')}
                  className="btn btn-danger"
                >
                  <XCircle size={16} />
                  Từ Chối
                </button>
              )}

              <button
                type="button"
                disabled={loading}
                onClick={() => handleDecision('APPROVE')}
                className="btn btn-success"
              >
                <CheckCircle size={16} />
                Phê Duyệt
              </button>
            </>
          )}

          {/* Revoke Scheduled Decision */}
          {transfer.status === 'Scheduled' && isHrOrAdmin && (
            activeAction === 'REVOKE' ? (
              <button
                type="button"
                disabled={loading}
                onClick={handleRevokeScheduled}
                className="btn btn-danger"
              >
                Xác Nhận Thu Hồi
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveAction('REVOKE')}
                className="btn btn-danger"
              >
                <Ban size={16} />
                Thu Hồi Quyết Định
              </button>
            )
          )}

        </div>

      </div>
    </div>
  );
}
