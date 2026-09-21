import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import CreateTransferModal from '../components/CreateTransferModal';
import TransferDetailModal from '../components/TransferDetailModal';
import { Users, FileCheck, Plus, Building2, Briefcase, ArrowRight } from 'lucide-react';

export default function ManagerDashboard() {
  const { user } = useAuth();

  const [managedEmployees, setManagedEmployees] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [proposeTargetEmployee, setProposeTargetEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'team' | 'all_transfers'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamRes, trfRes] = await Promise.all([
        api.get('/employees/managed'),
        api.get('/transfers')
      ]);
      if (teamRes.data.success) setManagedEmployees(teamRes.data.data);
      if (trfRes.data.success) setTransfers(trfRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const pendingApprovals = transfers.filter(t => t.status === 'PendingApproval');

  return (
    <div style={{ paddingBottom: '60px' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', color: '#3B241D' }}>Không Gian Quản Lý Phòng Ban</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Trưởng phòng: <strong>{user?.fullName}</strong> • {user?.departmentName}
            </p>
          </div>

          <button
            onClick={() => {
              setProposeTargetEmployee(null);
              setIsCreateOpen(true);
            }}
            className="btn btn-primary"
            style={{ padding: '12px 24px' }}
          >
            <Plus size={18} />
            Đề Xuất Điều Chuyển Nhân Viên
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>QUY MÔ NHÂN SỰ ĐỘI NGŨ</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                  {managedEmployees.length}
                </div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-peach)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} color="#5C3224" />
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Nhân sự thuộc quyền quản lý trực tiếp
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>HỒ SƠ CHỜ DUYỆT CẤP 1</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: pendingApprovals.length > 0 ? '#B45309' : '#198754', marginTop: '4px' }}>
                  {pendingApprovals.length}
                </div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(254, 243, 199, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileCheck size={24} color="#B45309" />
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Đơn cần phê duyệt, từ chối hoặc yêu cầu bổ sung
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('queue')}
            className={`btn ${activeTab === 'queue' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Hàng Đợi Chờ Duyệt ({pendingApprovals.length})
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`btn ${activeTab === 'team' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Danh Sách Nhân Sự Quản Lý ({managedEmployees.length})
          </button>
          <button
            onClick={() => setActiveTab('all_transfers')}
            className={`btn ${activeTab === 'all_transfers' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Tất Cả Hồ Sơ Điều Chuyển ({transfers.length})
          </button>
        </div>

        {/* Tab 1: Approval Queue */}
        {activeTab === 'queue' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Hồ Sơ Cần Xét Duyệt</h3>
            {pendingApprovals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                Hiện không có hồ sơ nào đang chờ quản lý xét duyệt.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mã Hồ Sơ</th>
                      <th>Nhân Sự</th>
                      <th>Phòng Ban Đến</th>
                      <th>Chức Vụ Mới</th>
                      <th>Loại Đơn</th>
                      <th>Ngày Hiệu Lực</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.map(t => (
                      <tr key={t.transferId}>
                        <td><strong>{t.transferCode}</strong></td>
                        <td>{t.employeeName} ({t.employeeCode})</td>
                        <td>{t.toDepartmentName}</td>
                        <td>{t.toPositionName}</td>
                        <td>{t.transferType}</td>
                        <td>{t.effectiveDate}</td>
                        <td>
                          <button
                            onClick={() => setSelectedTransfer(t)}
                            className="btn btn-primary"
                            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                          >
                            Xét Duyệt
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

        {/* Tab 2: Team Members */}
        {activeTab === 'team' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Đội Ngũ Nhân Sự Trực Thuộc</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã NV</th>
                    <th>Họ và Tên</th>
                    <th>Email</th>
                    <th>Chức Danh</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {managedEmployees.map(emp => (
                    <tr key={emp.employeeId}>
                      <td>{emp.employeeCode}</td>
                      <td><strong>{emp.fullName}</strong></td>
                      <td>{emp.email}</td>
                      <td>{emp.positionName}</td>
                      <td><span className="badge badge-completed">{emp.employmentStatus}</span></td>
                      <td>
                        <button
                          onClick={() => {
                            setProposeTargetEmployee(emp);
                            setIsCreateOpen(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          <ArrowRight size={14} />
                          Đề Xuất Chuyển
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: All Transfers */}
        {activeTab === 'all_transfers' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Lịch Sử Hồ Sơ Phòng Ban</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Nhân Sự</th>
                    <th>Từ Phòng Ban</th>
                    <th>Đến Phòng Ban</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map(t => (
                    <tr key={t.transferId}>
                      <td>{t.transferCode}</td>
                      <td>{t.employeeName}</td>
                      <td>{t.fromDepartmentName}</td>
                      <td>{t.toDepartmentName}</td>
                      <td><StatusBadge status={t.status} /></td>
                      <td>
                        <button
                          onClick={() => setSelectedTransfer(t)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          Xem chi tiết
                        </button>
                      </td>
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
        onClose={() => {
          setIsCreateOpen(false);
          setProposeTargetEmployee(null);
        }}
        onSuccess={fetchData}
        targetEmployee={proposeTargetEmployee}
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
