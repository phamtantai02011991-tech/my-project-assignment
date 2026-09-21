import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Calendar, XCircle, RotateCcw, Ban } from 'lucide-react';

const statusConfig = {
  Draft: { label: 'Bản nháp', class: 'badge-cancelled', icon: Clock },
  PendingApproval: { label: 'Chờ xét duyệt', class: 'badge-pending', icon: Clock },
  PendingEmployeeResponse: { label: 'Chờ NV xác nhận', class: 'badge-needinfo', icon: AlertCircle },
  NeedMoreInformation: { label: 'Yêu cầu bổ sung', class: 'badge-needinfo', icon: RotateCcw },
  Approved: { label: 'Đã phê duyệt', class: 'badge-approved', icon: CheckCircle2 },
  Scheduled: { label: 'Đã lên lịch', class: 'badge-scheduled', icon: Calendar },
  Completed: { label: 'Đã hoàn tất (ACID ST)', class: 'badge-completed', icon: CheckCircle2 },
  Rejected: { label: 'Bị từ chối', class: 'badge-rejected', icon: XCircle },
  Cancelled: { label: 'Đã hủy', class: 'badge-cancelled', icon: Ban }
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, class: 'badge-cancelled', icon: Clock };
  const Icon = config.icon;

  return (
    <span className={`badge ${config.class}`}>
      <Icon size={14} />
      {config.label}
    </span>
  );
}
