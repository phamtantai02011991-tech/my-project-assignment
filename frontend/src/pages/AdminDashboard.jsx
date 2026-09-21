import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import CreateTransferModal from '../components/CreateTransferModal';
import BulkTransferModal from '../components/BulkTransferModal';
import TransferDetailModal from '../components/TransferDetailModal';
import { Building2, Users, FileText, Plus, Layers, ShieldCheck, Search, BarChart3, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  const [transfers, setTransfers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('transfers'); // 'transfers' | 'org' | 'audit' | 'reports'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [trfRes, empRes, deptRes, posRes, logRes] = await Promise.all([
        api.get('/transfers'),
        api.get('/employees'),
        api.get('/departments'),
        api.get('/positions'),
        api.get('/audit-logs')
      ]);
      if (trfRes.data.success) setTransfers(trfRes.data.data);
      if (empRes.data.success) setEmployees(empRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (posRes.data.success) setPositions(posRes.data.data);
      if (logRes.data.success) setAuditLogs(logRes.data.data);
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
    }
  };

  const pendingCount = transfers.filter(t => t.status === 'PendingApproval').length;
  const scheduledCount = transfers.filter(t => t.status === 'Scheduled').length;
  const completedCount = transfers.filter(t => t.status === 'Completed').length;

  const filteredTransfers = transfers.filter(t => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesSearch = !searchQuery.trim() ||
      t.transferCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.toDepartmentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ paddingBottom: '60px' }}>
      <Navbar />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', color: '#3B241D' }}>Không Gian Ban Giám Đốc / Quản Trị Hệ Thống</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Xin chào <strong>{user?.fullName}</strong> • Giám sát toàn diện biến động nhân sự và quy trình điều chuyển
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
              style={{ padding: '12px 24px' }}
            >
              <Plus size={18} />
              Ban Hành Quyết Định Điều Chuyển
            </button>
          </div>
        </div>

        {/* Executive Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '28px' }}>
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TỔNG QUY MÔ NHÂN SỰ</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                  {employees.length}
                </div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-peach)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} color="#5C3224" />
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Phân bổ trên {departments.length} khối phòng ban
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>HỒ SƠ CẦN PHÊ CHUẨN</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: pendingCount > 0 ? '#B45309' : '#198754', marginTop: '4px' }}>
                  {pendingCount}
                </div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(254, 243, 199, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={24} color="#B45309" />
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Đơn chờ quyết định từ các phòng ban
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>ĐÃ HOÀN TẤT (ACID ST)</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#198754', marginTop: '4px' }}>
                  {completedCount}
                </div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(212, 243, 228, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={24} color="#198754" />
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Đã cập nhật cơ cấu tổ chức & lịch sử công tác
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>NHẬT KÝ KIỂM TOÁN</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                  {auditLogs.length}
                </div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(224, 242, 254, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={24} color="#0284C7" />
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Sự kiện kiểm toán bảo mật & tuân thủ
            </div>
          </div>
        </div>

        {/* Executive Tabs Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`btn ${activeTab === 'transfers' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <FileText size={18} />
            Hồ Sơ Điều Chuyển ({transfers.length})
          </button>

          <button
            onClick={() => setActiveTab('org')}
            className={`btn ${activeTab === 'org' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Building2 size={18} />
            Cơ Cấu Tổ Chức & Phòng Ban ({departments.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <ShieldCheck size={18} />
            Nhật Ký Kiểm Toán (Audit Trail) ({auditLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <BarChart3 size={18} />
            Báo Cáo Biến Động Cơ Cấu
          </button>
        </div>

        {/* Tab 1: Transfers Supervision */}
        {activeTab === 'transfers' && (
          <div className="glass-panel" style={{ padding: '28px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: '#3B241D' }}>Giám Sát Toàn Bộ Quy Trình Điều Chuyển</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  Ban Giám Đốc có quyền xem xét, phê chuẩn trực tiếp hoặc ban hành chỉ đạo
                </p>
              </div>

              {/* Search input */}
              <div style={{ position: 'relative', width: '280px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px', borderRadius: '20px', fontSize: '0.85rem' }}
                  placeholder="Tìm mã đơn, tên nhân viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
              </div>
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'Tất cả hồ sơ' },
                { id: 'PendingApproval', label: `Chờ duyệt (${pendingCount})` },
                { id: 'Scheduled', label: `Đã lên lịch (${scheduledCount})` },
                { id: 'Completed', label: `Đã hoàn tất (${completedCount})` },
                { id: 'Rejected', label: 'Bị từ chối' },
                { id: 'Cancelled', label: 'Đã hủy' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`btn ${statusFilter === f.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Transfers Table */}
            {filteredTransfers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                Không có hồ sơ điều chuyển nào phù hợp với bộ lọc.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mã Đơn</th>
                      <th>Nhân Sự</th>
                      <th>Phòng Ban Ban Đầu</th>
                      <th>Phòng Ban Tiếp Nhận</th>
                      <th>Chức Danh Đích</th>
                      <th>Loại Điều Chuyển</th>
                      <th>Ngày Hiệu Lực</th>
                      <th>Trạng Thái</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransfers.map(t => (
                      <tr key={t.transferId}>
                        <td><strong>{t.transferCode}</strong></td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{t.employeeName}</div>
                          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{t.employeeCode}</div>
                        </td>
                        <td>{t.fromDepartmentName}</td>
                        <td><strong>{t.toDepartmentName}</strong></td>
                        <td>{t.toPositionName}</td>
                        <td>
                          <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                            {t.transferType}
                          </span>
                        </td>
                        <td>{t.effectiveDate}</td>
                        <td><StatusBadge status={t.status} /></td>
                        <td>
                          <button
                            onClick={() => setSelectedTransfer(t)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                          >
                            Xem Chi Tiết
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

        {/* Tab 2: Organization & Departments */}
        {activeTab === 'org' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {departments.map(dept => {
              const deptEmployees = employees.filter(e => e.departmentId === dept.departmentId);
              const deptPositions = positions.filter(p => p.departmentId === dept.departmentId);

              return (
                <div key={dept.departmentId} className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <span className="badge badge-pending" style={{ marginBottom: '6px' }}>
                        {dept.departmentCode}
                      </span>
                      <h3 style={{ fontSize: '1.2rem', color: '#3B241D', marginTop: '4px' }}>
                        {dept.departmentName}
                      </h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {dept.description || 'Không có mô tả'}
                      </p>
                    </div>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'var(--primary-peach)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Building2 size={18} color="#5C3224" />
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    NHÂN SỰ THUỘC KHỐI ({deptEmployees.length} nhân viên):
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {deptEmployees.map(emp => (
                      <div
                        key={emp.employeeId}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 12px', background: 'rgba(255, 255, 255, 0.7)',
                          borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.04)'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {emp.fullName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {emp.positionName} • {emp.email}
                          </div>
                        </div>
                        <span className="badge badge-completed" style={{ fontSize: '0.75rem' }}>
                          {emp.role}
                        </span>
                      </div>
                    ))}
                  </div>

                  {deptPositions.length > 0 && (
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        CÁC VỊ TRÍ ĐỊNH BIÊN:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {deptPositions.map(p => (
                          <span key={p.positionId} style={{
                            fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px',
                            background: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)'
                          }}>
                            {p.positionName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: System Audit Trail */}
        {activeTab === 'audit' && (
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#3B241D' }}>
              Nhật Ký Kiểm Toán Toàn Doanh Nghiệp (Enterprise Audit Logs)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Lưu vết bất biến toàn bộ sự kiện: phê duyệt, từ chối, thi hành nguyên tử (ACID ST), đăng nhập và bảo mật
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Thời Gian</th>
                    <th>Người Thực Hiện</th>
                    <th>Hành Động</th>
                    <th>Đối Tượng</th>
                    <th>Mã Đơn / ID</th>
                    <th>Chi Tiết Biến Động</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.logId}>
                      <td>#{log.logId}</td>
                      <td>{log.createdAt}</td>
                      <td><strong>{log.userEmail || 'System.Scheduler'}</strong></td>
                      <td>
                        <span className="badge badge-scheduled">{log.action}</span>
                      </td>
                      <td>{log.entityType}</td>
                      <td>#{log.entityId || '—'}</td>
                      <td>{log.newValues || log.oldValues || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Executive Reports */}
        {activeTab === 'reports' && (
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#3B241D' }}>
              Báo Cáo Phân Bổ & Biến Động Nhân Sự Giữa Các Khối
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
              
              {/* Report 1: By Type */}
              <div className="glass-card">
                <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>Phân Loại Hình Thức Điều Chuyển</h4>
                {['EmployeeRequested', 'ManagerInitiated', 'HrInitiated', 'BulkTransfer', 'Temporary'].map(type => {
                  const count = transfers.filter(t => t.transferType === type).length;
                  const pct = transfers.length > 0 ? Math.round((count / transfers.length) * 100) : 0;
                  return (
                    <div key={type} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span>{type}</span>
                        <strong>{count} đơn ({pct}%)</strong>
                      </div>
                      <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary-accent)', borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Report 2: By Target Department */}
              <div className="glass-card">
                <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>Khối Phòng Ban Tiếp Nhận Nhiều Nhất</h4>
                {departments.map(d => {
                  const count = transfers.filter(t => t.toDepartmentId === d.departmentId).length;
                  return (
                    <div key={d.departmentId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '0.875rem' }}>
                      <span>{d.departmentName}</span>
                      <strong>{count} nhân sự tiếp nhận</strong>
                    </div>
                  );
                })}
              </div>

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
