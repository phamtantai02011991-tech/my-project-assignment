using EmployeeTransferApi.Dtos;
using EmployeeTransferApi.Entities;
using EmployeeTransferApi.Repositories;

namespace EmployeeTransferApi.Services;

public interface ITransferService
{
    TransferDetailDto CreateTransfer(CreateTransferRequestDto request, int actorId, string actorRole, string actorEmail);
    List<TransferDetailDto> CreateBulkTransfer(BulkTransferRequestDto request, int actorId, string actorRole, string actorEmail);
    TransferDetailDto ProcessDecision(int transferId, TransferDecisionDto decision, int approverId, string approverRole, string approverEmail);
    TransferDetailDto ProcessConsent(int transferId, TransferConsentDto consent, int employeeId);
    TransferDetailDto ResubmitTransfer(int transferId, ResubmitTransferDto request, int employeeId);
    TransferDetailDto CancelTransfer(int transferId, int actorId, string actorRole, string? reason);
    TransferDetailDto CancelApprovedTransfer(int transferId, int actorId, string actorRole, string reason);
    TransferDetailDto AmendTransfer(int transferId, AmendTransferDto request, int actorId, string actorRole);
}

public class TransferService : ITransferService
{
    private readonly ITransferRepository _trfRepo;
    private readonly IEmployeeRepository _empRepo;
    private readonly IAuditAndNotificationRepository _auditRepo;
    private readonly ILogger<TransferService> _logger;

    public TransferService(
        ITransferRepository trfRepo,
        IEmployeeRepository empRepo,
        IAuditAndNotificationRepository auditRepo,
        ILogger<TransferService> logger)
    {
        _trfRepo = trfRepo;
        _empRepo = empRepo;
        _auditRepo = auditRepo;
        _logger = logger;
    }

    public TransferDetailDto CreateTransfer(CreateTransferRequestDto request, int actorId, string actorRole, string actorEmail)
    {
        int targetEmpId = request.EmployeeId ?? actorId;
        var emp = _empRepo.GetById(targetEmpId) ?? throw new ArgumentException("Nhân viên không tồn tại.");

        if (emp.EmploymentStatus != "Active")
            throw new InvalidOperationException("Nhân viên hiện không ở trạng thái hoạt động.");

        // Rule: Target Dept exists
        var depts = _empRepo.GetDepartments();
        var toDept = depts.FirstOrDefault(d => d.DepartmentId == request.ToDepartmentId)
            ?? throw new ArgumentException("Phòng ban chuyển đến không tồn tại.");

        // Rule: Target Dept != Current Dept
        if (request.ToDepartmentId == emp.DepartmentId)
            throw new InvalidOperationException("Phòng ban chuyển đến không được trùng với phòng ban hiện tại.");

        // Rule: Target Position exists & belongs to Target Dept (if not keeping position)
        var positions = _empRepo.GetPositions();
        var toPos = positions.FirstOrDefault(p => p.PositionId == request.ToPositionId);
        if (toPos == null)
            throw new ArgumentException("Vị trí công việc chuyển đến không tồn tại.");

        if (!request.KeepPosition && toPos.DepartmentId != request.ToDepartmentId)
            throw new InvalidOperationException("Vị trí công việc phải thuộc về phòng ban chuyển đến.");

        // Rule: No active transfer
        if (_trfRepo.HasActiveTransfer(emp.EmployeeId))
            throw new InvalidOperationException("Nhân viên đang có một hồ sơ điều chuyển chưa hoàn tất.");

        // Rule: Effective date valid
        if (string.IsNullOrWhiteSpace(request.EffectiveDate))
            throw new ArgumentException("Ngày hiệu lực không được để trống.");

        var transferCode = $"TRF-{DateTime.UtcNow:yyyyMM}-{Random.Shared.Next(1000, 9999)}";

        // Determine Initial Status
        string initialStatus = "PendingApproval";
        string initialConsent = "Accepted";

        if (request.RequireEmployeeConsent && actorRole != "employee")
        {
            initialStatus = "PendingEmployeeResponse";
            initialConsent = "Pending";
        }
        else if (actorRole == "admin")
        {
            // Executive order may bypass directly to Scheduled or Completed
            initialStatus = "Approved";
        }

        var entity = new DepartmentTransfer
        {
            TransferCode = transferCode,
            EmployeeId = emp.EmployeeId,
            FromDepartmentId = emp.DepartmentId,
            ToDepartmentId = request.ToDepartmentId,
            FromPositionId = emp.PositionId,
            ToPositionId = request.ToPositionId,
            FromManagerId = emp.ManagerId,
            ToManagerId = request.ToManagerId,
            TransferType = request.TransferType,
            EffectiveDate = request.EffectiveDate,
            ReturnDate = request.ReturnDate,
            Reason = request.Reason,
            Notes = request.Notes,
            AttachmentsJson = request.AttachmentsJson,
            Status = initialStatus,
            EmployeeConsent = initialConsent,
            InitiatorId = actorId,
            InitiatorRole = actorRole
        };

        int id = _trfRepo.Create(entity);
        entity.TransferId = id;

        // Build Approval Chain
        if (initialStatus == "PendingApproval")
        {
            if (actorRole == "employee")
            {
                // Current Manager L1, HR L2
                if (emp.ManagerId.HasValue)
                {
                    _trfRepo.CreateApproval(new TransferApproval
                    {
                        TransferId = id,
                        ApproverId = emp.ManagerId.Value,
                        ApproverRole = "current_manager",
                        ApprovalLevel = 1,
                        Status = "Pending"
                    });
                }
                var hrUser = _empRepo.GetAllProfiles().FirstOrDefault(p => p.Role == "hr");
                if (hrUser != null)
                {
                    _trfRepo.CreateApproval(new TransferApproval
                    {
                        TransferId = id,
                        ApproverId = hrUser.EmployeeId,
                        ApproverRole = "hr",
                        ApprovalLevel = 2,
                        Status = "Pending"
                    });
                }
            }
            else if (actorRole == "manager")
            {
                // Manager already approved, route to HR
                _trfRepo.CreateApproval(new TransferApproval
                {
                    TransferId = id,
                    ApproverId = actorId,
                    ApproverRole = "current_manager",
                    ApprovalLevel = 1,
                    Status = "Approved",
                    Comment = "Quản lý chủ động đề xuất",
                    ActionDate = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss")
                });

                var hrUser = _empRepo.GetAllProfiles().FirstOrDefault(p => p.Role == "hr");
                if (hrUser != null)
                {
                    _trfRepo.CreateApproval(new TransferApproval
                    {
                        TransferId = id,
                        ApproverId = hrUser.EmployeeId,
                        ApproverRole = "hr",
                        ApprovalLevel = 2,
                        Status = "Pending"
                    });
                }
            }
        }

        _auditRepo.InsertAudit(actorId, actorEmail, "CREATE_TRANSFER", "DepartmentTransfer", id, null, $"Created transfer {transferCode} status {initialStatus}");

        if (initialStatus == "PendingEmployeeResponse")
        {
            _auditRepo.InsertNotification(emp.EmployeeId, "Quyết định điều chuyển cần xác nhận", $"Bạn có quyết định điều chuyển mã {transferCode} cần phản hồi đồng ý hoặc từ chối.", "warning", id);
        }
        else
        {
            if (emp.ManagerId.HasValue && actorRole == "employee")
            {
                _auditRepo.InsertNotification(emp.ManagerId.Value, "Đơn điều chuyển mới cần duyệt", $"Nhân viên {emp.FullName} vừa tạo đơn điều chuyển {transferCode}.", "info", id);
            }
        }

        // If directly approved by admin, check execution
        if (initialStatus == "Approved")
        {
            CheckAndCompleteOrSchedule(id, request.EffectiveDate, actorId, actorEmail);
        }

        return _trfRepo.GetDetailById(id)!;
    }

    public List<TransferDetailDto> CreateBulkTransfer(BulkTransferRequestDto request, int actorId, string actorRole, string actorEmail)
    {
        if (actorRole != "hr" && actorRole != "admin")
            throw new UnauthorizedAccessException("Chỉ Nhân sự hoặc Ban Giám Đốc mới có quyền điều chuyển hàng loạt.");

        if (request.EmployeeIds == null || request.EmployeeIds.Count == 0)
            throw new ArgumentException("Danh sách nhân sự điều chuyển không được rỗng.");

        var batchCode = $"BATCH-{DateTime.UtcNow:yyyyMM}-{Random.Shared.Next(100, 999)}";
        var results = new List<TransferDetailDto>();

        foreach (var empId in request.EmployeeIds)
        {
            var emp = _empRepo.GetById(empId);
            if (emp == null || _trfRepo.HasActiveTransfer(empId)) continue;

            var transferCode = $"TRF-{DateTime.UtcNow:yyyyMM}-{Random.Shared.Next(1000, 9999)}";
            var entity = new DepartmentTransfer
            {
                TransferCode = transferCode,
                BatchCode = batchCode,
                EmployeeId = emp.EmployeeId,
                FromDepartmentId = emp.DepartmentId,
                ToDepartmentId = request.ToDepartmentId,
                FromPositionId = emp.PositionId,
                ToPositionId = request.ToPositionId,
                FromManagerId = emp.ManagerId,
                ToManagerId = request.ToManagerId,
                TransferType = request.TransferType,
                EffectiveDate = request.EffectiveDate,
                Reason = request.Reason,
                Notes = request.Notes,
                Status = "Approved",
                EmployeeConsent = "Accepted",
                InitiatorId = actorId,
                InitiatorRole = actorRole
            };

            int id = _trfRepo.Create(entity);
            CheckAndCompleteOrSchedule(id, request.EffectiveDate, actorId, actorEmail);
            results.Add(_trfRepo.GetDetailById(id)!);
        }

        _auditRepo.InsertAudit(actorId, actorEmail, "BULK_TRANSFER", "DepartmentTransfer", null, null, $"Bulk transfer {batchCode} for {results.Count} employees");
        return results;
    }

    public TransferDetailDto ProcessDecision(int transferId, TransferDecisionDto decision, int approverId, string approverRole, string approverEmail)
    {
        var trf = _trfRepo.GetEntityById(transferId) ?? throw new ArgumentException("Hồ sơ điều chuyển không tồn tại.");

        if (trf.Status != "PendingApproval")
            throw new InvalidOperationException($"Không thể xét duyệt đơn ở trạng thái: {trf.Status}");

        var approvals = _trfRepo.GetApprovals(transferId);
        var currentApproval = approvals.FirstOrDefault(a => a.ApproverRole == approverRole && a.Status == "Pending")
            ?? approvals.FirstOrDefault(a => a.Status == "Pending");

        if (decision.Action.ToUpper() == "REJECT")
        {
            if (string.IsNullOrWhiteSpace(decision.Comment))
                throw new ArgumentException("Từ chối đơn bắt buộc phải có lý do.");

            trf.Status = "Rejected";
            _trfRepo.Update(trf);

            if (currentApproval != null)
            {
                _trfRepo.UpdateApproval(new TransferApproval
                {
                    ApprovalId = currentApproval.ApprovalId,
                    Status = "Rejected",
                    Comment = decision.Comment
                });
            }

            _auditRepo.InsertAudit(approverId, approverEmail, "REJECT_TRANSFER", "DepartmentTransfer", transferId, "PendingApproval", $"Rejected: {decision.Comment}");
            _auditRepo.InsertNotification(trf.EmployeeId, "Hồ sơ điều chuyển bị từ chối", $"Hồ sơ {trf.TransferCode} đã bị từ chối với lý do: {decision.Comment}", "danger", transferId);
        }
        else if (decision.Action.ToUpper() == "REQUEST_INFO")
        {
            if (string.IsNullOrWhiteSpace(decision.Comment))
                throw new ArgumentException("Yêu cầu bổ sung thông tin bắt buộc phải nêu rõ nội dung cần bổ sung.");

            trf.Status = "NeedMoreInformation";
            _trfRepo.Update(trf);

            if (currentApproval != null)
            {
                _trfRepo.UpdateApproval(new TransferApproval
                {
                    ApprovalId = currentApproval.ApprovalId,
                    Status = "RequestedInfo",
                    Comment = decision.Comment
                });
            }

            _auditRepo.InsertAudit(approverId, approverEmail, "REQUEST_INFO", "DepartmentTransfer", transferId, "PendingApproval", $"Requested info: {decision.Comment}");
            _auditRepo.InsertNotification(trf.EmployeeId, "Yêu cầu bổ sung hồ sơ điều chuyển", $"Cần bổ sung thông tin cho hồ sơ {trf.TransferCode}: {decision.Comment}", "warning", transferId);
        }
        else if (decision.Action.ToUpper() == "APPROVE")
        {
            if (currentApproval != null)
            {
                _trfRepo.UpdateApproval(new TransferApproval
                {
                    ApprovalId = currentApproval.ApprovalId,
                    Status = "Approved",
                    Comment = decision.Comment
                });
            }

            // Check if there are remaining pending approvals
            var updatedApprovals = _trfRepo.GetApprovals(transferId);
            bool hasRemainingPending = updatedApprovals.Any(a => a.Status == "Pending");

            if (!hasRemainingPending || approverRole == "hr" || approverRole == "admin")
            {
                // Fully approved!
                trf.Status = "Approved";
                _trfRepo.Update(trf);

                _auditRepo.InsertAudit(approverId, approverEmail, "APPROVE_TRANSFER", "DepartmentTransfer", transferId, "PendingApproval", "Fully approved");
                CheckAndCompleteOrSchedule(transferId, trf.EffectiveDate, approverId, approverEmail);
            }
            else
            {
                _auditRepo.InsertAudit(approverId, approverEmail, "APPROVE_LEVEL", "DepartmentTransfer", transferId, "PendingApproval", $"Approved level by {approverRole}");
            }
        }
        else
        {
            throw new ArgumentException($"Hành động không hợp lệ: {decision.Action}");
        }

        return _trfRepo.GetDetailById(transferId)!;
    }

    public TransferDetailDto ProcessConsent(int transferId, TransferConsentDto consent, int employeeId)
    {
        var trf = _trfRepo.GetEntityById(transferId) ?? throw new ArgumentException("Hồ sơ không tồn tại.");
        if (trf.EmployeeId != employeeId)
            throw new UnauthorizedAccessException("Bạn không có quyền phản hồi hồ sơ của nhân viên khác.");

        if (trf.Status != "PendingEmployeeResponse")
            throw new InvalidOperationException("Hồ sơ hiện không ở trạng thái chờ phản hồi của nhân viên.");

        if (consent.Consent.ToUpper() == "ACCEPT")
        {
            trf.EmployeeConsent = "Accepted";
            trf.ConsentComment = consent.Comment;
            trf.Status = "PendingApproval";
            _trfRepo.Update(trf);

            _auditRepo.InsertAudit(employeeId, null, "EMPLOYEE_ACCEPT", "DepartmentTransfer", transferId, "PendingEmployeeResponse", "Employee accepted transfer");
            _auditRepo.InsertNotification(trf.InitiatorId ?? 4, "Nhân viên đã đồng ý điều chuyển", $"Nhân viên đã đồng thuận với quyết định điều chuyển {trf.TransferCode}.", "success", transferId);
        }
        else if (consent.Consent.ToUpper() == "DECLINE")
        {
            trf.EmployeeConsent = "Declined";
            trf.ConsentComment = consent.Comment ?? "Nhân viên từ chối tiếp nhận quyết định điều chuyển.";
            trf.Status = "Rejected";
            _trfRepo.Update(trf);

            _auditRepo.InsertAudit(employeeId, null, "EMPLOYEE_DECLINE", "DepartmentTransfer", transferId, "PendingEmployeeResponse", $"Employee declined: {consent.Comment}");
            _auditRepo.InsertNotification(trf.InitiatorId ?? 4, "Nhân viên từ chối điều chuyển", $"Nhân viên đã từ chối quyết định điều chuyển {trf.TransferCode}: {consent.Comment}", "danger", transferId);
        }
        else
        {
            throw new ArgumentException("Lựa chọn phản hồi không hợp lệ.");
        }

        return _trfRepo.GetDetailById(transferId)!;
    }

    public TransferDetailDto ResubmitTransfer(int transferId, ResubmitTransferDto request, int employeeId)
    {
        var trf = _trfRepo.GetEntityById(transferId) ?? throw new ArgumentException("Hồ sơ không tồn tại.");
        if (trf.EmployeeId != employeeId && trf.InitiatorId != employeeId)
            throw new UnauthorizedAccessException("Bạn không có quyền gửi lại hồ sơ này.");

        if (trf.Status != "NeedMoreInformation")
            throw new InvalidOperationException("Chỉ hồ sơ bị yêu cầu bổ sung thông tin mới được phép gửi lại.");

        if (request.ToDepartmentId.HasValue) trf.ToDepartmentId = request.ToDepartmentId.Value;
        if (request.ToPositionId.HasValue) trf.ToPositionId = request.ToPositionId.Value;
        if (request.ToManagerId.HasValue) trf.ToManagerId = request.ToManagerId.Value;
        if (!string.IsNullOrEmpty(request.EffectiveDate)) trf.EffectiveDate = request.EffectiveDate;
        if (!string.IsNullOrEmpty(request.Reason)) trf.Reason = request.Reason;
        if (!string.IsNullOrEmpty(request.Notes)) trf.Notes = request.Notes;
        if (!string.IsNullOrEmpty(request.AttachmentsJson)) trf.AttachmentsJson = request.AttachmentsJson;

        trf.Status = "PendingApproval";
        _trfRepo.Update(trf);

        // Reset approvals to pending
        var approvals = _trfRepo.GetApprovals(transferId);
        foreach (var a in approvals)
        {
            _trfRepo.UpdateApproval(new TransferApproval
            {
                ApprovalId = a.ApprovalId,
                Status = "Pending",
                Comment = "Đã cập nhật lại thông tin hồ sơ"
            });
        }

        _auditRepo.InsertAudit(employeeId, null, "RESUBMIT_TRANSFER", "DepartmentTransfer", transferId, "NeedMoreInformation", $"Resubmitted with comment: {request.Comment}");
        if (trf.FromManagerId.HasValue)
        {
            _auditRepo.InsertNotification(trf.FromManagerId.Value, "Hồ sơ đã được gửi lại", $"Nhân viên đã bổ sung thông tin cho hồ sơ {trf.TransferCode}.", "info", transferId);
        }

        return _trfRepo.GetDetailById(transferId)!;
    }

    public TransferDetailDto CancelTransfer(int transferId, int actorId, string actorRole, string? reason)
    {
        var trf = _trfRepo.GetEntityById(transferId) ?? throw new ArgumentException("Hồ sơ không tồn tại.");

        if (actorRole != "hr" && actorRole != "admin" && trf.EmployeeId != actorId && trf.InitiatorId != actorId)
            throw new UnauthorizedAccessException("Bạn không có quyền hủy hồ sơ này.");

        if (trf.Status == "Completed" || trf.Status == "Cancelled" || trf.Status == "Rejected")
            throw new InvalidOperationException($"Không thể hủy hồ sơ ở trạng thái {trf.Status}.");

        trf.Status = "Cancelled";
        trf.Notes = string.IsNullOrWhiteSpace(reason) ? trf.Notes : $"{trf.Notes} | [Hủy bởi {actorRole}: {reason}]";
        _trfRepo.Update(trf);

        _auditRepo.InsertAudit(actorId, null, "CANCEL_TRANSFER", "DepartmentTransfer", transferId, trf.Status, $"Cancelled: {reason}");
        _auditRepo.InsertNotification(trf.EmployeeId, "Hồ sơ điều chuyển đã hủy", $"Hồ sơ {trf.TransferCode} đã được hủy bỏ.", "warning", transferId);

        return _trfRepo.GetDetailById(transferId)!;
    }

    public TransferDetailDto CancelApprovedTransfer(int transferId, int actorId, string actorRole, string reason)
    {
        if (actorRole != "hr" && actorRole != "admin")
            throw new UnauthorizedAccessException("Chỉ Nhân sự hoặc Ban Giám Đốc mới có quyền hủy quyết định đã duyệt.");

        var trf = _trfRepo.GetEntityById(transferId) ?? throw new ArgumentException("Hồ sơ không tồn tại.");
        if (trf.Status != "Scheduled")
            throw new InvalidOperationException("Chỉ quyết định đang chờ hiệu lực (Scheduled) mới được phép hủy.");

        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Hủy quyết định đã duyệt bắt buộc phải có lý do.");

        trf.Status = "Cancelled";
        trf.Notes = $"{trf.Notes} | [Thu hồi quyết định: {reason}]";
        _trfRepo.Update(trf);

        _auditRepo.InsertAudit(actorId, null, "REVOKE_APPROVED_TRANSFER", "DepartmentTransfer", transferId, "Scheduled", $"Revoked: {reason}");
        _auditRepo.InsertNotification(trf.EmployeeId, "Thu hồi quyết định điều chuyển", $"Quyết định điều chuyển {trf.TransferCode} đã bị thu hồi: {reason}", "danger", transferId);

        return _trfRepo.GetDetailById(transferId)!;
    }

    public TransferDetailDto AmendTransfer(int transferId, AmendTransferDto request, int actorId, string actorRole)
    {
        if (actorRole != "hr" && actorRole != "admin")
            throw new UnauthorizedAccessException("Chỉ Nhân sự hoặc Ban Giám Đốc mới có quyền điều chỉnh hồ sơ.");

        var trf = _trfRepo.GetEntityById(transferId) ?? throw new ArgumentException("Hồ sơ không tồn tại.");
        if (trf.Status == "Completed" || trf.Status == "Cancelled")
            throw new InvalidOperationException("Không thể chỉnh sửa quyết định đã hoàn tất hoặc đã hủy.");

        if (request.ToPositionId.HasValue) trf.ToPositionId = request.ToPositionId.Value;
        if (request.ToManagerId.HasValue) trf.ToManagerId = request.ToManagerId.Value;
        if (!string.IsNullOrEmpty(request.EffectiveDate)) trf.EffectiveDate = request.EffectiveDate;
        if (!string.IsNullOrEmpty(request.ReturnDate)) trf.ReturnDate = request.ReturnDate;
        if (!string.IsNullOrEmpty(request.Notes)) trf.Notes = request.Notes;

        _trfRepo.Update(trf);

        _auditRepo.InsertAudit(actorId, null, "AMEND_TRANSFER", "DepartmentTransfer", transferId, null, "Amended transfer details");
        return _trfRepo.GetDetailById(transferId)!;
    }

    private void CheckAndCompleteOrSchedule(int transferId, string effectiveDate, int? actorId, string? actorEmail)
    {
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        if (string.Compare(effectiveDate, today, StringComparison.OrdinalIgnoreCase) <= 0)
        {
            // Execute ACID Transaction ST immediately!
            _trfRepo.ExecuteAtomicTransferST(transferId, today, "IMMEDIATE_EXECUTION", actorId, actorEmail);
            _logger.LogInformation("ACID ST executed immediately for transfer ID {id}", transferId);
        }
        else
        {
            // Schedule for future date
            var trf = _trfRepo.GetEntityById(transferId)!;
            trf.Status = "Scheduled";
            _trfRepo.Update(trf);
            _logger.LogInformation("Transfer ID {id} set to Scheduled with EffectiveDate {date}", transferId, effectiveDate);
        }
    }
}
