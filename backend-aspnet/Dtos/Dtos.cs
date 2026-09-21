using System.Text.Json.Serialization;

namespace EmployeeTransferApi.Dtos;

// Auth DTOs
public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequestDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "employee"; // employee, manager, hr, admin
    public int DepartmentId { get; set; }
    public int PositionId { get; set; }
    public int? ManagerId { get; set; }
    public string? Phone { get; set; }
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public UserProfileDto User { get; set; } = new();
}

public class UserProfileDto
{
    public int EmployeeId { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public int PositionId { get; set; }
    public string PositionName { get; set; } = string.Empty;
    public int? ManagerId { get; set; }
    public string? ManagerName { get; set; }
    public string EmploymentStatus { get; set; } = "Active";
}

// Transfer DTOs
public class CreateTransferRequestDto
{
    public int? EmployeeId { get; set; } // If null, inferred from authenticated user
    public int ToDepartmentId { get; set; }
    public int ToPositionId { get; set; }
    public int? ToManagerId { get; set; }
    public string TransferType { get; set; } = "EmployeeRequested"; // EmployeeRequested, ManagerInitiated, HrInitiated, ManagementDirected, Temporary, Permanent
    public string EffectiveDate { get; set; } = string.Empty; // YYYY-MM-DD
    public string? ReturnDate { get; set; } // For temporary
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? AttachmentsJson { get; set; }
    public bool KeepPosition { get; set; } = false;
    public bool RequireEmployeeConsent { get; set; } = false;
}

public class BulkTransferRequestDto
{
    public List<int> EmployeeIds { get; set; } = new();
    public int ToDepartmentId { get; set; }
    public int ToPositionId { get; set; }
    public int? ToManagerId { get; set; }
    public string EffectiveDate { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string TransferType { get; set; } = "BulkTransfer";
}

public class TransferDecisionDto
{
    public string Action { get; set; } = string.Empty; // APPROVE, REJECT, REQUEST_INFO
    public string? Comment { get; set; }
}

public class TransferConsentDto
{
    public string Consent { get; set; } = string.Empty; // ACCEPT, DECLINE
    public string? Comment { get; set; }
}

public class ResubmitTransferDto
{
    public int? ToDepartmentId { get; set; }
    public int? ToPositionId { get; set; }
    public int? ToManagerId { get; set; }
    public string? EffectiveDate { get; set; }
    public string? Reason { get; set; }
    public string? Notes { get; set; }
    public string? AttachmentsJson { get; set; }
    public string? Comment { get; set; }
}

public class AmendTransferDto
{
    public int? ToPositionId { get; set; }
    public int? ToManagerId { get; set; }
    public string? EffectiveDate { get; set; }
    public string? ReturnDate { get; set; }
    public string? Notes { get; set; }
}

public class TransferDetailDto
{
    public int TransferId { get; set; }
    public string TransferCode { get; set; } = string.Empty;
    public string? BatchCode { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string EmployeeEmail { get; set; } = string.Empty;
    
    public int FromDepartmentId { get; set; }
    public string FromDepartmentName { get; set; } = string.Empty;
    public int ToDepartmentId { get; set; }
    public string ToDepartmentName { get; set; } = string.Empty;
    
    public int FromPositionId { get; set; }
    public string FromPositionName { get; set; } = string.Empty;
    public int ToPositionId { get; set; }
    public string ToPositionName { get; set; } = string.Empty;
    
    public int? FromManagerId { get; set; }
    public string? FromManagerName { get; set; }
    public int? ToManagerId { get; set; }
    public string? ToManagerName { get; set; }
    
    public string TransferType { get; set; } = string.Empty;
    public string EffectiveDate { get; set; } = string.Empty;
    public string? ReturnDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? AttachmentsJson { get; set; }
    public string Status { get; set; } = string.Empty;
    public string EmployeeConsent { get; set; } = string.Empty;
    public string? ConsentComment { get; set; }
    public int? InitiatorId { get; set; }
    public string InitiatorRole { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;

    public List<ApprovalRecordDto> Approvals { get; set; } = new();
}

public class ApprovalRecordDto
{
    public int ApprovalId { get; set; }
    public int ApprovalLevel { get; set; }
    public string ApproverRole { get; set; } = string.Empty;
    public string ApproverName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Comment { get; set; }
    public string? ActionDate { get; set; }
}

public class ApiResponse<T>
{
    public bool Success { get; set; } = true;
    public string? Message { get; set; }
    public T? Data { get; set; }
}
