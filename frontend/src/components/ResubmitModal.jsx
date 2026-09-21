import React, { useState } from 'react';
import api from '../api/client';
import { X, Send, AlertCircle } from 'lucide-react';

export default function ResubmitModal({ transfer, isOpen, onClose, onSuccess }) {
  const [effectiveDate, setEffectiveDate] = useState(transfer?.effectiveDate || '');
  const [reason, setReason] = useState(transfer?.reason || '');
  const [notes, setNotes] = useState(transfer?.notes || '');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !transfer) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Vui lòng nhập ghi chú giải trình / nội dung đã bổ sung.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        effectiveDate,
        reason,
        notes,
        comment
      };
      const res = await api.put(`/transfers/${transfer.transferId}/resubmit`, payload);
      if (res.data.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi gửi lại hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#3B241D' }}>Bổ Sung Thông Tin & Gửi Lại</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Cập nhật các nội dung theo yêu cầu của người xét duyệt ({transfer.transferCode})
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
          
          <div className="form-group">
            <label className="form-label">Ngày hiệu lực</label>
            <input
              type="date"
              className="form-input"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Lý do điều chuyển</label>
            <textarea
              className="form-textarea"
              rows={2}
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Giải trình nội dung đã bổ sung (Bắt buộc) *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Nêu rõ các tài liệu hoặc thông tin đã chỉnh sửa, bổ sung..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="btn btn-accent">
              <Send size={16} />
              {loading ? 'Đang gửi...' : 'Gửi Lại Hồ Sơ'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
