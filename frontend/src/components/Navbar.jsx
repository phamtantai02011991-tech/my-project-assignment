import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Bell, LogOut, Building2, User, CheckCircle2 } from 'lucide-react';

const roleLabels = {
  employee: { text: 'Nhân viên', bg: 'rgba(2, 132, 199, 0.15)', color: '#0284C7' },
  manager: { text: 'Quản lý phòng ban', bg: 'rgba(180, 83, 9, 0.15)', color: '#B45309' },
  hr: { text: 'Chuyên viên Nhân sự', bg: 'rgba(126, 34, 206, 0.15)', color: '#7E22CE' },
  admin: { text: 'Ban Giám Đốc / Admin', bg: 'rgba(224, 135, 106, 0.25)', color: '#C66A4E' }
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const timer = setInterval(fetchNotifications, 15000);
      return () => clearInterval(timer);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const roleInfo = roleLabels[user?.role] || { text: user?.role, bg: 'rgba(0,0,0,0.1)', color: '#333' };

  return (
    <header className="glass-panel" style={{
      position: 'sticky',
      top: 0,
      zIndex: 500,
      borderRadius: '0 0 24px 24px',
      margin: '0 0 28px 0',
      padding: '16px 36px',
      boxShadow: '0 8px 32px 0 rgba(198, 106, 78, 0.12)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #F8DAD0 0%, #E8BCB0 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(232, 188, 176, 0.4)',
            color: '#5C3224'
          }}>
            <Building2 size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3B241D', letterSpacing: '-0.03em' }}>
              HR Transfer Workflow
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Hệ thống Điều chuyển Nhân sự Doanh nghiệp
            </p>
          </div>
        </div>

        {/* User Info & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          {/* Role Badge */}
          <div style={{
            padding: '6px 14px', borderRadius: '20px',
            backgroundColor: roleInfo.bg, color: roleInfo.color,
            fontSize: '0.825rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <User size={14} />
            {roleInfo.text}
          </div>

          {/* User Details */}
          <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
            <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              {user?.positionName} • {user?.departmentName}
            </div>
          </div>

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              style={{
                position: 'relative', width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.8)', border: '1px solid var(--glass-border-peach)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-main)', transition: 'var(--transition)'
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-2px', right: '-2px',
                  backgroundColor: '#DC2626', color: '#FFF', fontSize: '0.7rem',
                  fontWeight: 800, width: '18px', height: '18px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown with Click-Outside Backdrop */}
            {showNotifDropdown && (
              <>
                <div
                  onClick={() => setShowNotifDropdown(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 998, cursor: 'default' }}
                />
                <div className="glass-card" style={{
                  position: 'absolute', right: 0, top: '48px', width: '380px',
                  zIndex: 999, padding: '18px', maxHeight: '440px', overflowY: 'auto',
                  background: 'rgba(255, 255, 255, 0.97)',
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 20px 48px rgba(92, 50, 36, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08)',
                  border: '1px solid var(--glass-border-peach)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '0.95rem' }}>Thông Báo</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notifications.length} thông báo</span>
                  </div>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                      Chưa có thông báo nào.
                    </p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.notificationId}
                        onClick={() => markAsRead(n.notificationId)}
                        style={{
                          padding: '10px 12px', borderRadius: '8px', marginBottom: '8px',
                          background: n.isRead ? 'transparent' : 'rgba(248, 218, 208, 0.25)',
                          borderLeft: n.isRead ? '3px solid transparent' : '3px solid var(--primary-accent)',
                          cursor: 'pointer', transition: 'var(--transition)'
                        }}
                      >
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{n.title}</div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{n.message}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{n.createdAt}</div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="btn btn-secondary"
            title="Đăng xuất"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>

        </div>

      </div>
    </header>
  );
}
