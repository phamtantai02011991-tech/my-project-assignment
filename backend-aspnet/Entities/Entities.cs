namespace EmployeeTransferApi.Entities;

public class Role
{
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty; // employee, manager, hr, admin
    public string Description { get; set; } = string.Empty;
}

public class Department
{
    public int DepartmentId { get; set; }
    public string DepartmentCode { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public int? ParentDepartmentId { get; set; }
    public string? Description { get; set; }
    public int IsActive { get; set; } = 1;
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class Position
{
    public int PositionId { get; set; }
    public string PositionCode { get; set; } = string.Empty;
    public string PositionName { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public string? Description { get; set; }
    public int IsActive { get; set; } = 1;
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class Employee
{
    public int EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "employee"; // employee, manager, hr, admin
    public string? Phone { get; set; }
    public int DepartmentId { get; set; }
    public int PositionId { get; set; }
    public int? ManagerId { get; set; }
    public string? HireDate { get; set; }
    public string EmploymentStatus { get; set; } = "Active";
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class DepartmentTransfer
{
    public int TransferId { get; set; }
    public string TransferCode { get; set; } = string.Empty;
    public string? BatchCode { get; set; }
    public int EmployeeId { get; set; }
    public int FromDepartmentId { get; set; }
    public int ToDepartmentId { get; set; }
    public int FromPositionId { get; set; }
    public int ToPositionId { get; set; }
    public int? FromManagerId { get; set; }
    public int? ToManagerId { get; set; }
    public string TransferType { get; set; } = "EmployeeRequested"; // EmployeeRequested, ManagerInitiated, HrInitiated, ManagementDirected, Temporary, Permanent
    public string EffectiveDate { get; set; } = string.Empty;
    public string? ReturnDate { get; set; } // For temporary transfer
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? AttachmentsJson { get; set; }
    public string Status { get; set; } = "PendingApproval"; // Draft, PendingApproval, PendingEmployeeResponse, NeedMoreInformation, Approved, Scheduled, Completed, Rejected, Cancelled
    public string EmployeeConsent { get; set; } = "Accepted"; // Pending, Accepted, Declined
    public string? ConsentComment { get; set; }
    public int? InitiatorId { get; set; }
    public string InitiatorRole { get; set; } = "employee";
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class TransferApproval
{
    public int ApprovalId { get; set; }
    public int TransferId { get; set; }
    public int ApproverId { get; set; }
    public string ApproverRole { get; set; } = string.Empty; // current_manager, new_manager, hr, admin
    public int ApprovalLevel { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, RequestedInfo
    public string? Comment { get; set; }
    public string? ActionDate { get; set; }
}

public class EmploymentHistory
{
    public int HistoryId { get; set; }
    public int EmployeeId { get; set; }
    public int? TransferId { get; set; }
    public int DepartmentId { get; set; }
    public int PositionId { get; set; }
    public int? ManagerId { get; set; }
    public string StartDate { get; set; } = string.Empty;
    public string? EndDate { get; set; }
    public string ChangeType { get; set; } = "Transfer";
    public string? Reason { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class AuditLog
{
    public int LogId { get; set; }
    public int? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class Notification
{
    public int NotificationId { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public int IsRead { get; set; } = 0;
    public int? TransferId { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}
