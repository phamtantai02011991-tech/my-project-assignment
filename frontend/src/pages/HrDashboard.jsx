import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import CreateTransferModal from '../components/CreateTransferModal';
import BulkTransferModal from '../components/BulkTransferModal';
import TransferDetailModal from '../components/TransferDetailModal';
import { Users, FileText, CalendarCheck, ShieldAlert, Plus, Layers, Search, History } from 'lucide-react';

export default function HrDashboard() {
  const { user } = useAuth();

  const [transfers, setTransfers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'all' | 'directory' | 'audit'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [trfRes, empRes, logRes] = await Promise.all([
        api.get('/transfers'),
        api.get('/employees'),
        api.get('/audit-logs')
      ]);
      if (trfRes.data.success) setTransfers(trfRes.data.data);
      if (empRes.data.success) setEmployees(empRes.data.data);
      if (logRes.data.success) setAuditLogs(logRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const pendingApprovals = transfers.filter(t => t.status === 'PendingApproval');
  const scheduledTransfers = transfers.filter(t => t.status === 'Scheduled');
  const completedTransfers = transfers.filter(t => t.status === 'Completed');

  const filteredTransfers = statusFilter === 'ALL'
    ? transfers
    : transfers.filter(t => t.status === statusFilter);

  return (
    <div style={{ paddingBottom: '60px' }}>
      <Navbar />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Header with Dual Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', color: '#3B241D' }}>Không Gian Quản Trị Nhân Sự (HR)</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Điều phối quy trình điều chuyển nhân sự toàn doanh nghiệp
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setIsBulkOpen(true)}
              className="btn btn-secondary"
              style={{ padding: '12px 20px' }}
            >
              <Layers size={18} color="var(--primary-accent)" />
              Điều Chuyển Hàng Loạt
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn btn-primary"
              style={{ padding: '12px 22px' }}
            >
              <Plus size={18} />
              Tạo Hồ Sơ Điều Động
            </button>
          </div>
        </div>

        {/* Enterprise Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '28px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TỔNG NHÂN SỰ DOANH NGHIỆP</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              {employees.length}
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Toàn bộ các khối phòng ban</div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>HỒ SƠ CHỜ THẨM ĐỊNH</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: pendingApprovals.length > 0 ? '#B45309' : '#198754', marginTop: '4px' }}>
              {pendingApprovals.length}
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Cần HR phê duyệt / lên lịch</div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>HỒ SƠ ĐÃ LÊN LỊCH (SCHEDULED)</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#7E22CE', marginTop: '4px' }}>
              {scheduledTransfers.length}
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Tự động thi hành khi đến ngày</div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>ĐIỀU CHUYỂN HOÀN TẤT (ACID ST)</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#198754', marginTop: '4px' }}>
              {completedTransfers.length}
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Đã ghi nhận Employment History</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('queue')}
            className={`btn ${activeTab === 'queue' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Hồ Sơ Cần Duyệt ({pendingApprovals.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Toàn Bộ Hồ Sơ ({transfers.length})
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`btn ${activeTab === 'directory' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Danh Bạ Nhân Sự ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Nhật Ký Kiểm Toán ({auditLogs.length})
          </button>
        </div>

        {/* Tab 1: HR Approval Queue */}
        {activeTab === 'queue' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Hồ Sơ Chờ Phê Duyệt & Lập Lịch Hiệu Lực</h3>
            {pendingApprovals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                Không có hồ sơ nào đang chờ HR xử lý.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mã Đơn</th>
                      <th>Nhân Sự</th>
                      <th>Từ Phòng Ban</th>
                      <th>Đến Phòng Ban</th>
                      <th>Chức Vụ Đích</th>
                      <th>Loại Đơn</th>
                      <th>Ngày Hiệu Lực</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.map(t => (
                      <tr key={t.transferId}>
                        <td><strong>{t.transferCode}</strong></td>
                        <td>{t.employeeName}</td>
                        <td>{t.fromDepartmentName}</td>
                        <td><strong>{t.toDepartmentName}</strong></td>
                        <td>{t.toPositionName}</td>
                        <td>{t.transferType}</td>
                        <td>{t.effectiveDate}</td>
                        <td>
                          <button
                            onClick={() => setSelectedTransfer(t)}
                            className="btn btn-primary"
                            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                          >
                            Xử Lý Đơn
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

        {/* Tab 2: All Transfers with Filter */}
        {activeTab === 'all' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Quản Lý Toàn Bộ Hồ Sơ Điều Chuyển</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['ALL', 'PendingApproval', 'Scheduled', 'Completed', 'Rejected', 'Cancelled'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.775rem', padding: '4px 12px' }}
                  >
                    {st === 'ALL' ? 'Tất cả' : st}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Nhân Sự</th>
                    <th>Từ Phòng</th>
                    <th>Đến Phòng</th>
                    <th>Ngày Hiệu Lực</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransfers.map(t => (
                    <tr key={t.transferId}>
                      <td>{t.transferCode}</td>
                      <td>{t.employeeName}</td>
                      <td>{t.fromDepartmentName}</td>
                      <td>{t.toDepartmentName}</td>
                      <td>{t.effectiveDate}</td>
                      <td><StatusBadge status={t.status} /></td>
                      <td>
                        <button
                          onClick={() => setSelectedTransfer(t)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          Chi Tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Directory */}
        {activeTab === 'directory' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Danh Bạ Nhân Sự Doanh Nghiệp</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã NV</th>
                    <th>Họ và Tên</th>
                    <th>Email</th>
                    <th>Phòng Ban</th>
                    <th>Chức Vụ</th>
                    <th>Quản Lý Trực Tiếp</th>
                    <th>Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.employeeId}>
                      <td>{emp.employeeCode}</td>
                      <td><strong>{emp.fullName}</strong></td>
                      <td>{emp.email}</td>
                      <td>{emp.departmentName}</td>
                      <td>{emp.positionName}</td>
                      <td>{emp.managerName || '—'}</td>
                      <td><span className="badge badge-completed">{emp.employmentStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Nhật Ký Kiểm Toán Hệ Thống (Audit Trail)</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Ghi nhận minh bạch mọi thao tác: tạo đơn, duyệt, từ chối, thi hành ACID ST, cập nhật trạng thái.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Thời Gian</th>
                    <th>Người Thực Hiện</th>
                    <th>Hành Động</th>
                    <th>Đối Tượng</th>
                    <th>Dữ Liệu Thay Đổi</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.logId}>
                      <td>#{log.logId}</td>
                      <td>{log.createdAt}</td>
                      <td>{log.userEmail || 'System.Scheduler'}</td>
                      <td><span className="badge badge-scheduled">{log.action}</span></td>
                      <td>{log.entityType} #{log.entityId}</td>
                      <td>{log.newValues || log.oldValues || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      <CreateTransferModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchData}
      />

      <BulkTransferModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={fetchData}
      />

      <TransferDetailModal
        transfer={selectedTransfer}
        isOpen={!!selectedTransfer}
        onClose={() => setSelectedTransfer(null)}
        onActionSuccess={fetchData}
      />
    </div>
  );
}
