import React from 'react';
import { FileText, UserCheck, ShieldCheck, CalendarCheck, Check } from 'lucide-react';

export default function TransferTimeline({ status, approvals = [], effectiveDate }) {
  const steps = [
    { key: 'create', label: 'Tạo hồ sơ', icon: FileText },
    { key: 'manager', label: 'Quản lý duyệt', icon: UserCheck },
    { key: 'hr', label: 'Nhân sự duyệt', icon: ShieldCheck },
    { key: 'scheduled', label: 'Lên lịch / Hiệu lực', icon: CalendarCheck },
    { key: 'completed', label: 'Hoàn tất', icon: Check }
  ];

  let currentStepIndex = 0;
  if (status === 'Draft') currentStepIndex = 0;
  else if (status === 'PendingApproval' || status === 'PendingEmployeeResponse' || status === 'NeedMoreInformation') {
    const hasMgrApproved = approvals.some(a => a.ApproverRole === 'current_manager' && a.Status === 'Approved');
    currentStepIndex = hasMgrApproved ? 2 : 1;
  }
  else if (status === 'Approved') currentStepIndex = 3;
  else if (status === 'Scheduled') currentStepIndex = 3;
  else if (status === 'Completed') currentStepIndex = 4;
  else if (status === 'Rejected' || status === 'Cancelled') currentStepIndex = -1;

  return (
    <div className="timeline">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        let stepClass = '';
        if (currentStepIndex === -1) {
          stepClass = '';
        } else if (idx < currentStepIndex) {
          stepClass = 'completed';
        } else if (idx === currentStepIndex) {
          stepClass = 'active';
        }

        return (
          <div key={step.key} className={`timeline-step ${stepClass}`}>
            <div className="timeline-icon">
              <Icon size={18} />
            </div>
            <span className="timeline-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
