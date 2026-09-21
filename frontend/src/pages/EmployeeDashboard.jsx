import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import CreateTransferModal from '../components/CreateTransferModal';
import TransferDetailModal from '../components/TransferDetailModal';
import ResubmitModal from '../components/ResubmitModal';
import { Plus, Building2, Briefcase, User, Calendar, History, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const [myTransfers, setMyTransfers] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('transfers'); // 'transfers' | 'history'

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [resubmitTarget, setResubmitTarget] = useState(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trfRes, histRes] = await Promise.all([
        api.get('/transfers'),
        api.get(`/employees/${user?.employeeId}/history`)
      ]);
      if (trfRes.data.success) setMyTransfers(trfRes.data.data);
      if (histRes.data.success) setHistory(histRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeTransfer = myTransfers.find(t =>
    ['PendingApproval', 'PendingEmployeeResponse', 'NeedMoreInformation', 'Scheduled'].includes(t.status)
  );

  return (
    <div style={{ paddingBottom: '60px' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Welcome & Action Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', color: '#3B241D' }}>Không Gian Làm Việc Nhân Viên</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Xin chào <strong>{user?.fullName}</strong> ({user?.employeeCode})
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '0.95rem' }}
          >
            <Plus size={18} />
            Tạo Đơn Xin Chuyển Phòng Ban
          </button>
        </div>

        {/* Current Organizational Status Banner */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#5C3224', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} />
            Thông Tin Tổ Chức Hiện Tại
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PHÒNG BAN HIỆN TẠI</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                {user?.departmentName}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>CHỨC VỤ / VỊ TRÍ</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                {user?.positionName}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>QUẢN LÝ TRỰC TIẾP</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                {user?.managerName || 'Chưa phân công'}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TRẠNG THÁI NHÂN SỰ</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#198754', marginTop: '4px' }}>
                {user?.employmentStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Urgent Action Alert for Consent or Returned Request */}
        {activeTransfer && activeTransfer.status === 'PendingEmployeeResponse' && (
          <div className="glass-panel" style={{
            padding: '20px', marginBottom: '24px',
            background: 'rgba(254, 243, 199, 0.95)',
            border: '1px solid rgba(180, 83, 9, 0.3)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <h4 style={{ color: '#B45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} />
                Quyết định điều chuyển cần sự xác nhận của bạn
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#78350F', marginTop: '4px' }}>
                Hồ sơ mã <strong>{activeTransfer.transferCode}</strong> sang <strong>{activeTransfer.toDepartmentName}</strong> ({activeTransfer.toPositionName}) đang chờ bạn đồng thuận hoặc từ chối.
              </p>
            </div>
            <button
              onClick={() => setSelectedTransfer(activeTransfer)}
              className="btn btn-primary"
              style={{ backgroundColor: '#F59E0B', color: '#FFF' }}
            >
              Xem & Phản Hồi Ngay
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`btn ${activeTab === 'transfers' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <FileText size={18} />
            Đơn Điều Chuyển Của Tôi ({myTransfers.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <History size={18} />
            Lịch Sử Luân Chuyển Công Tác ({history.length})
          </button>
        </div>

        {/* Tab 1: Transfers List */}
        {activeTab === 'transfers' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Danh Sách Hồ Sơ Điều Chuyển</h3>

            {myTransfers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                Bạn chưa có đơn điều chuyển nào. Bấm <strong>Tạo Đơn Xin Chuyển</strong> ở trên để bắt đầu.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mã Hồ Sơ</th>
                      <th>Phòng Ban Đến</th>
                      <th>Chức Vụ Đến</th>
                      <th>Loại Điều Chuyển</th>
                      <th>Ngày Hiệu Lực</th>
                      <th>Trạng Thái</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTransfers.map(t => (
                      <tr key={t.transferId}>
                        <td><strong>{t.transferCode}</strong></td>
                        <td>{t.toDepartmentName}</td>
                        <td>{t.toPositionName}</td>
                        <td>{t.transferType}</td>
                        <td>{t.effectiveDate}</td>
                        <td><StatusBadge status={t.status} /></td>
                        <td>
                          <button
                            onClick={() => setSelectedTransfer(t)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Employment History */}
        {activeTab === 'history' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Hồ Sơ Lịch Sử Công Tác (Employment Histories)</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Dữ liệu bất biến được tự động ghi nhận qua cơ chế ACID Transaction ST khi điều chuyển hoàn tất.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã Lịch Sử</th>
                    <th>Phòng Ban</th>
                    <th>Chức Danh</th>
                    <th>Ngày Bắt Đầu</th>
                    <th>Ngày Kết Thúc</th>
                    <th>Loại Thay Đổi</th>
                    <th>Lý Do / Ghi Chú</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.historyId}>
                      <td>HIST-00{h.historyId}</td>
                      <td><strong>Phòng ban #{h.departmentId}</strong></td>
                      <td>Vị trí #{h.positionId}</td>
                      <td>{h.startDate}</td>
                      <td>{h.endDate || <span className="badge badge-completed">Hiện tại</span>}</td>
                      <td>{h.changeType}</td>
                      <td>{h.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      <CreateTransferModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchData}
      />

      <TransferDetailModal
        transfer={selectedTransfer}
        isOpen={!!selectedTransfer}
        onClose={() => setSelectedTransfer(null)}
        onActionSuccess={fetchData}
        onOpenResubmit={(trf) => setResubmitTarget(trf)}
      />

      <ResubmitModal
        transfer={resubmitTarget}
        isOpen={!!resubmitTarget}
        onClose={() => setResubmitTarget(null)}
        onSuccess={fetchData}
      />
    </div>
  );
}
