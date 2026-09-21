using System.Data;
using EmployeeTransferApi.Data;
using EmployeeTransferApi.Dtos;
using EmployeeTransferApi.Entities;
using Microsoft.Data.Sqlite;

namespace EmployeeTransferApi.Repositories;

public interface ITransferRepository
{
    TransferDetailDto? GetDetailById(int id);
    DepartmentTransfer? GetEntityById(int id);
    List<TransferDetailDto> GetAll(string? status = null, int? employeeId = null, int? departmentId = null, string? batchCode = null);
    bool HasActiveTransfer(int employeeId);
    int Create(DepartmentTransfer transfer);
    bool Update(DepartmentTransfer transfer);
    int CreateApproval(TransferApproval approval);
    List<ApprovalRecordDto> GetApprovals(int transferId);
    bool UpdateApproval(TransferApproval approval);
    List<DepartmentTransfer> GetScheduledDueTransfers(string todayDate);
    bool ExecuteAtomicTransferST(int transferId, string effectiveDate, string auditAction, int? executorId, string? executorEmail);
}

public class TransferRepository : ITransferRepository
{
    private readonly SqliteDbConnection _db;

    public TransferRepository(SqliteDbConnection db)
    {
        _db = db;
    }

    public TransferDetailDto? GetDetailById(int id)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT t.*, 
                   e.FullName as EmployeeName, e.EmployeeCode, e.Email as EmployeeEmail,
                   fd.DepartmentName as FromDepartmentName, td.DepartmentName as ToDepartmentName,
                   fp.PositionName as FromPositionName, tp.PositionName as ToPositionName,
                   fm.FullName as FromManagerName, tm.FullName as ToManagerName
            FROM department_transfers t
            JOIN employees e ON t.EmployeeId = e.EmployeeId
            JOIN departments fd ON t.FromDepartmentId = fd.DepartmentId
            JOIN departments td ON t.ToDepartmentId = td.DepartmentId
            JOIN positions fp ON t.FromPositionId = fp.PositionId
            JOIN positions tp ON t.ToPositionId = tp.PositionId
            LEFT JOIN employees fm ON t.FromManagerId = fm.EmployeeId
            LEFT JOIN employees tm ON t.ToManagerId = tm.EmployeeId
            WHERE t.TransferId = @id LIMIT 1;
        ";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        if (!reader.Read()) return null;

        var dto = MapDetail(reader);
        reader.Close();

        dto.Approvals = GetApprovals(id);
        return dto;
    }

    public DepartmentTransfer? GetEntityById(int id)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM department_transfers WHERE TransferId = @id LIMIT 1;";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        if (!reader.Read()) return null;

        return new DepartmentTransfer
        {
            TransferId = reader.GetInt32(reader.GetOrdinal("TransferId")),
            TransferCode = reader.GetString(reader.GetOrdinal("TransferCode")),
            BatchCode = reader.IsDBNull(reader.GetOrdinal("BatchCode")) ? null : reader.GetString(reader.GetOrdinal("BatchCode")),
            EmployeeId = reader.GetInt32(reader.GetOrdinal("EmployeeId")),
            FromDepartmentId = reader.GetInt32(reader.GetOrdinal("FromDepartmentId")),
            ToDepartmentId = reader.GetInt32(reader.GetOrdinal("ToDepartmentId")),
            FromPositionId = reader.GetInt32(reader.GetOrdinal("FromPositionId")),
            ToPositionId = reader.GetInt32(reader.GetOrdinal("ToPositionId")),
            FromManagerId = reader.IsDBNull(reader.GetOrdinal("FromManagerId")) ? null : reader.GetInt32(reader.GetOrdinal("FromManagerId")),
            ToManagerId = reader.IsDBNull(reader.GetOrdinal("ToManagerId")) ? null : reader.GetInt32(reader.GetOrdinal("ToManagerId")),
            TransferType = reader.GetString(reader.GetOrdinal("TransferType")),
            EffectiveDate = reader.GetString(reader.GetOrdinal("EffectiveDate")),
            ReturnDate = reader.IsDBNull(reader.GetOrdinal("ReturnDate")) ? null : reader.GetString(reader.GetOrdinal("ReturnDate")),
            Reason = reader.GetString(reader.GetOrdinal("Reason")),
            Notes = reader.IsDBNull(reader.GetOrdinal("Notes")) ? null : reader.GetString(reader.GetOrdinal("Notes")),
            AttachmentsJson = reader.IsDBNull(reader.GetOrdinal("AttachmentsJson")) ? null : reader.GetString(reader.GetOrdinal("AttachmentsJson")),
            Status = reader.GetString(reader.GetOrdinal("Status")),
            EmployeeConsent = reader.GetString(reader.GetOrdinal("EmployeeConsent")),
            ConsentComment = reader.IsDBNull(reader.GetOrdinal("ConsentComment")) ? null : reader.GetString(reader.GetOrdinal("ConsentComment")),
            InitiatorId = reader.IsDBNull(reader.GetOrdinal("InitiatorId")) ? null : reader.GetInt32(reader.GetOrdinal("InitiatorId")),
            InitiatorRole = reader.GetString(reader.GetOrdinal("InitiatorRole")),
            CreatedAt = reader.GetString(reader.GetOrdinal("CreatedAt")),
            UpdatedAt = reader.GetString(reader.GetOrdinal("UpdatedAt"))
        };
    }

    public List<TransferDetailDto> GetAll(string? status = null, int? employeeId = null, int? departmentId = null, string? batchCode = null)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();

        var query = @"
            SELECT t.*, 
                   e.FullName as EmployeeName, e.EmployeeCode, e.Email as EmployeeEmail,
                   fd.DepartmentName as FromDepartmentName, td.DepartmentName as ToDepartmentName,
                   fp.PositionName as FromPositionName, tp.PositionName as ToPositionName,
                   fm.FullName as FromManagerName, tm.FullName as ToManagerName
            FROM department_transfers t
            JOIN employees e ON t.EmployeeId = e.EmployeeId
            JOIN departments fd ON t.FromDepartmentId = fd.DepartmentId
            JOIN departments td ON t.ToDepartmentId = td.DepartmentId
            JOIN positions fp ON t.FromPositionId = fp.PositionId
            JOIN positions tp ON t.ToPositionId = tp.PositionId
            LEFT JOIN employees fm ON t.FromManagerId = fm.EmployeeId
            LEFT JOIN employees tm ON t.ToManagerId = tm.EmployeeId
            WHERE 1=1
        ";

        if (!string.IsNullOrEmpty(status))
        {
            query += " AND t.Status = @status";
            cmd.Parameters.AddWithValue("@status", status);
        }
        if (employeeId.HasValue)
        {
            query += " AND t.EmployeeId = @empId";
            cmd.Parameters.AddWithValue("@empId", employeeId.Value);
        }
        if (departmentId.HasValue)
        {
            query += " AND (t.FromDepartmentId = @deptId OR t.ToDepartmentId = @deptId)";
            cmd.Parameters.AddWithValue("@deptId", departmentId.Value);
        }
        if (!string.IsNullOrEmpty(batchCode))
        {
            query += " AND t.BatchCode = @batch";
            cmd.Parameters.AddWithValue("@batch", batchCode);
        }

        query += " ORDER BY t.TransferId DESC;";
        cmd.CommandText = query;

        using var reader = cmd.ExecuteReader();
        var list = new List<TransferDetailDto>();
        while (reader.Read())
        {
            list.Add(MapDetail(reader));
        }
        return list;
    }

    public bool HasActiveTransfer(int employeeId)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT COUNT(*) FROM department_transfers 
            WHERE EmployeeId = @empId AND Status IN ('Draft', 'PendingApproval', 'PendingEmployeeResponse', 'NeedMoreInformation', 'Approved', 'Scheduled');
        ";
        cmd.Parameters.AddWithValue("@empId", employeeId);
        return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
    }

    public int Create(DepartmentTransfer transfer)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO department_transfers 
            (TransferCode, BatchCode, EmployeeId, FromDepartmentId, ToDepartmentId, FromPositionId, ToPositionId, FromManagerId, ToManagerId,
             TransferType, EffectiveDate, ReturnDate, Reason, Notes, AttachmentsJson, Status, EmployeeConsent, ConsentComment, InitiatorId, InitiatorRole)
            VALUES
            (@code, @batch, @empId, @fromDept, @toDept, @fromPos, @toPos, @fromMgr, @toMgr,
             @type, @effDate, @retDate, @reason, @notes, @attach, @status, @consent, @consentComm, @initId, @initRole);
            SELECT last_insert_rowid();
        ";
        cmd.Parameters.AddWithValue("@code", transfer.TransferCode);
        cmd.Parameters.AddWithValue("@batch", (object?)transfer.BatchCode ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@empId", transfer.EmployeeId);
        cmd.Parameters.AddWithValue("@fromDept", transfer.FromDepartmentId);
        cmd.Parameters.AddWithValue("@toDept", transfer.ToDepartmentId);
        cmd.Parameters.AddWithValue("@fromPos", transfer.FromPositionId);
        cmd.Parameters.AddWithValue("@toPos", transfer.ToPositionId);
        cmd.Parameters.AddWithValue("@fromMgr", (object?)transfer.FromManagerId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@toMgr", (object?)transfer.ToManagerId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@type", transfer.TransferType);
        cmd.Parameters.AddWithValue("@effDate", transfer.EffectiveDate);
        cmd.Parameters.AddWithValue("@retDate", (object?)transfer.ReturnDate ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@reason", transfer.Reason);
        cmd.Parameters.AddWithValue("@notes", (object?)transfer.Notes ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@attach", (object?)transfer.AttachmentsJson ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@status", transfer.Status);
        cmd.Parameters.AddWithValue("@consent", transfer.EmployeeConsent);
        cmd.Parameters.AddWithValue("@consentComm", (object?)transfer.ConsentComment ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@initId", (object?)transfer.InitiatorId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@initRole", transfer.InitiatorRole);

        return Convert.ToInt32(cmd.ExecuteScalar());
    }

    public bool Update(DepartmentTransfer transfer)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            UPDATE department_transfers SET
                ToDepartmentId = @toDept,
                ToPositionId = @toPos,
                ToManagerId = @toMgr,
                EffectiveDate = @effDate,
                ReturnDate = @retDate,
                Reason = @reason,
                Notes = @notes,
                AttachmentsJson = @attach,
                Status = @status,
                EmployeeConsent = @consent,
                ConsentComment = @consentComm,
                UpdatedAt = CURRENT_TIMESTAMP
            WHERE TransferId = @id;
        ";
        cmd.Parameters.AddWithValue("@id", transfer.TransferId);
        cmd.Parameters.AddWithValue("@toDept", transfer.ToDepartmentId);
        cmd.Parameters.AddWithValue("@toPos", transfer.ToPositionId);
        cmd.Parameters.AddWithValue("@toMgr", (object?)transfer.ToManagerId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@effDate", transfer.EffectiveDate);
        cmd.Parameters.AddWithValue("@retDate", (object?)transfer.ReturnDate ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@reason", transfer.Reason);
        cmd.Parameters.AddWithValue("@notes", (object?)transfer.Notes ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@attach", (object?)transfer.AttachmentsJson ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@status", transfer.Status);
        cmd.Parameters.AddWithValue("@consent", transfer.EmployeeConsent);
        cmd.Parameters.AddWithValue("@consentComm", (object?)transfer.ConsentComment ?? DBNull.Value);

        return cmd.ExecuteNonQuery() > 0;
    }

    public int CreateApproval(TransferApproval approval)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO transfer_approvals (TransferId, ApproverId, ApproverRole, ApprovalLevel, Status, Comment, ActionDate)
            VALUES (@trfId, @appId, @role, @level, @status, @comment, @date);
            SELECT last_insert_rowid();
        ";
        cmd.Parameters.AddWithValue("@trfId", approval.TransferId);
        cmd.Parameters.AddWithValue("@appId", approval.ApproverId);
        cmd.Parameters.AddWithValue("@role", approval.ApproverRole);
        cmd.Parameters.AddWithValue("@level", approval.ApprovalLevel);
        cmd.Parameters.AddWithValue("@status", approval.Status);
        cmd.Parameters.AddWithValue("@comment", (object?)approval.Comment ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@date", (object?)approval.ActionDate ?? DBNull.Value);

        return Convert.ToInt32(cmd.ExecuteScalar());
    }

    public List<ApprovalRecordDto> GetApprovals(int transferId)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT a.ApprovalId, a.ApprovalLevel, a.ApproverRole, e.FullName as ApproverName, a.Status, a.Comment, a.ActionDate
            FROM transfer_approvals a
            JOIN employees e ON a.ApproverId = e.EmployeeId
            WHERE a.TransferId = @trfId
            ORDER BY a.ApprovalLevel ASC, a.ApprovalId ASC;
        ";
        cmd.Parameters.AddWithValue("@trfId", transferId);
        using var reader = cmd.ExecuteReader();
        var list = new List<ApprovalRecordDto>();
        while (reader.Read())
        {
            list.Add(new ApprovalRecordDto
            {
                ApprovalId = reader.GetInt32(0),
                ApprovalLevel = reader.GetInt32(1),
                ApproverRole = reader.GetString(2),
                ApproverName = reader.GetString(3),
                Status = reader.GetString(4),
                Comment = reader.IsDBNull(5) ? null : reader.GetString(5),
                ActionDate = reader.IsDBNull(6) ? null : reader.GetString(6)
            });
        }
        return list;
    }

    public bool UpdateApproval(TransferApproval approval)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            UPDATE transfer_approvals SET
                Status = @status,
                Comment = @comment,
                ActionDate = CURRENT_TIMESTAMP
            WHERE ApprovalId = @id;
        ";
        cmd.Parameters.AddWithValue("@id", approval.ApprovalId);
        cmd.Parameters.AddWithValue("@status", approval.Status);
        cmd.Parameters.AddWithValue("@comment", (object?)approval.Comment ?? DBNull.Value);
        return cmd.ExecuteNonQuery() > 0;
    }

    public List<DepartmentTransfer> GetScheduledDueTransfers(string todayDate)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT * FROM department_transfers
            WHERE Status = 'Scheduled' AND EffectiveDate <= @today;
        ";
        cmd.Parameters.AddWithValue("@today", todayDate);
        using var reader = cmd.ExecuteReader();
        var list = new List<DepartmentTransfer>();
        while (reader.Read())
        {
            list.Add(new DepartmentTransfer
            {
                TransferId = reader.GetInt32(reader.GetOrdinal("TransferId")),
                TransferCode = reader.GetString(reader.GetOrdinal("TransferCode")),
                EmployeeId = reader.GetInt32(reader.GetOrdinal("EmployeeId")),
                FromDepartmentId = reader.GetInt32(reader.GetOrdinal("FromDepartmentId")),
                ToDepartmentId = reader.GetInt32(reader.GetOrdinal("ToDepartmentId")),
                FromPositionId = reader.GetInt32(reader.GetOrdinal("FromPositionId")),
                ToPositionId = reader.GetInt32(reader.GetOrdinal("ToPositionId")),
                FromManagerId = reader.IsDBNull(reader.GetOrdinal("FromManagerId")) ? null : reader.GetInt32(reader.GetOrdinal("FromManagerId")),
                ToManagerId = reader.IsDBNull(reader.GetOrdinal("ToManagerId")) ? null : reader.GetInt32(reader.GetOrdinal("ToManagerId")),
                TransferType = reader.GetString(reader.GetOrdinal("TransferType")),
                EffectiveDate = reader.GetString(reader.GetOrdinal("EffectiveDate")),
                Reason = reader.GetString(reader.GetOrdinal("Reason")),
                Status = reader.GetString(reader.GetOrdinal("Status")),
                InitiatorRole = reader.GetString(reader.GetOrdinal("InitiatorRole"))
            });
        }
        return list;
    }

    /// <summary>
    /// Critical ACID Transaction ST Execution:
    /// 1. Close current employment history with EndDate
    /// 2. Insert new employment history with StartDate
    /// 3. Update employee (DepartmentId, PositionId, ManagerId)
    /// 4. Update transfer Status = 'Completed'
    /// 5. Record audit log
    /// </summary>
    public bool ExecuteAtomicTransferST(int transferId, string effectiveDate, string auditAction, int? executorId, string? executorEmail)
    {
        using var conn = _db.CreateConnection();
        using var tx = conn.BeginTransaction();

        try
        {
            // 1. Fetch Transfer info
            DepartmentTransfer? trf;
            using (var cmdTrf = conn.CreateCommand())
            {
                cmdTrf.Transaction = tx;
                cmdTrf.CommandText = "SELECT * FROM department_transfers WHERE TransferId = @id LIMIT 1;";
                cmdTrf.Parameters.AddWithValue("@id", transferId);
                using var reader = cmdTrf.ExecuteReader();
                if (!reader.Read()) return false;
                trf = new DepartmentTransfer
                {
                    TransferId = reader.GetInt32(reader.GetOrdinal("TransferId")),
                    TransferCode = reader.GetString(reader.GetOrdinal("TransferCode")),
                    EmployeeId = reader.GetInt32(reader.GetOrdinal("EmployeeId")),
                    FromDepartmentId = reader.GetInt32(reader.GetOrdinal("FromDepartmentId")),
                    ToDepartmentId = reader.GetInt32(reader.GetOrdinal("ToDepartmentId")),
                    FromPositionId = reader.GetInt32(reader.GetOrdinal("FromPositionId")),
                    ToPositionId = reader.GetInt32(reader.GetOrdinal("ToPositionId")),
                    FromManagerId = reader.IsDBNull(reader.GetOrdinal("FromManagerId")) ? null : reader.GetInt32(reader.GetOrdinal("FromManagerId")),
                    ToManagerId = reader.IsDBNull(reader.GetOrdinal("ToManagerId")) ? null : reader.GetInt32(reader.GetOrdinal("ToManagerId")),
                    TransferType = reader.GetString(reader.GetOrdinal("TransferType")),
                    Reason = reader.GetString(reader.GetOrdinal("Reason"))
                };
            }

            // 2. Close existing employment history record
            using (var cmdCloseHist = conn.CreateCommand())
            {
                cmdCloseHist.Transaction = tx;
                cmdCloseHist.CommandText = @"
                    UPDATE employment_histories 
                    SET EndDate = @effDate 
                    WHERE EmployeeId = @empId AND EndDate IS NULL;
                ";
                cmdCloseHist.Parameters.AddWithValue("@effDate", effectiveDate);
                cmdCloseHist.Parameters.AddWithValue("@empId", trf.EmployeeId);
                cmdCloseHist.ExecuteNonQuery();
            }

            // 3. Insert new employment history record
            using (var cmdNewHist = conn.CreateCommand())
            {
                cmdNewHist.Transaction = tx;
                cmdNewHist.CommandText = @"
                    INSERT INTO employment_histories 
                    (EmployeeId, TransferId, DepartmentId, PositionId, ManagerId, StartDate, EndDate, ChangeType, Reason)
                    VALUES
                    (@empId, @trfId, @deptId, @posId, @mgrId, @startDate, NULL, @type, @reason);
                ";
                cmdNewHist.Parameters.AddWithValue("@empId", trf.EmployeeId);
                cmdNewHist.Parameters.AddWithValue("@trfId", trf.TransferId);
                cmdNewHist.Parameters.AddWithValue("@deptId", trf.ToDepartmentId);
                cmdNewHist.Parameters.AddWithValue("@posId", trf.ToPositionId);
                cmdNewHist.Parameters.AddWithValue("@mgrId", (object?)trf.ToManagerId ?? DBNull.Value);
                cmdNewHist.Parameters.AddWithValue("@startDate", effectiveDate);
                cmdNewHist.Parameters.AddWithValue("@type", trf.TransferType);
                cmdNewHist.Parameters.AddWithValue("@reason", trf.Reason);
                cmdNewHist.ExecuteNonQuery();
            }

            // 4. Update Employee organizational attributes (ST rule: ONLY via transfer workflow)
            using (var cmdEmp = conn.CreateCommand())
            {
                cmdEmp.Transaction = tx;
                cmdEmp.CommandText = @"
                    UPDATE employees SET
                        DepartmentId = @deptId,
                        PositionId = @posId,
                        ManagerId = @mgrId,
                        UpdatedAt = CURRENT_TIMESTAMP
                    WHERE EmployeeId = @empId;
                ";
                cmdEmp.Parameters.AddWithValue("@deptId", trf.ToDepartmentId);
                cmdEmp.Parameters.AddWithValue("@posId", trf.ToPositionId);
                cmdEmp.Parameters.AddWithValue("@mgrId", (object?)trf.ToManagerId ?? DBNull.Value);
                cmdEmp.Parameters.AddWithValue("@empId", trf.EmployeeId);
                cmdEmp.ExecuteNonQuery();
            }

            // 5. Update transfer Status = 'Completed'
            using (var cmdComplete = conn.CreateCommand())
            {
                cmdComplete.Transaction = tx;
                cmdComplete.CommandText = @"
                    UPDATE department_transfers SET
                        Status = 'Completed',
                        UpdatedAt = CURRENT_TIMESTAMP
                    WHERE TransferId = @id;
                ";
                cmdComplete.Parameters.AddWithValue("@id", transferId);
                cmdComplete.ExecuteNonQuery();
            }

            // 6. Record Audit Log
            using (var cmdAudit = conn.CreateCommand())
            {
                cmdAudit.Transaction = tx;
                cmdAudit.CommandText = @"
                    INSERT INTO audit_logs (UserId, UserEmail, Action, EntityType, EntityId, OldValues, NewValues, CreatedAt)
                    VALUES (@uid, @email, @act, 'DepartmentTransfer', @entId, @old, @new, CURRENT_TIMESTAMP);
                ";
                cmdAudit.Parameters.AddWithValue("@uid", (object?)executorId ?? DBNull.Value);
                cmdAudit.Parameters.AddWithValue("@email", (object?)executorEmail ?? "System.Scheduler");
                cmdAudit.Parameters.AddWithValue("@act", auditAction);
                cmdAudit.Parameters.AddWithValue("@entId", transferId);
                cmdAudit.Parameters.AddWithValue("@old", $"Dept:{trf.FromDepartmentId}, Pos:{trf.FromPositionId}");
                cmdAudit.Parameters.AddWithValue("@new", $"Dept:{trf.ToDepartmentId}, Pos:{trf.ToPositionId}");
                cmdAudit.ExecuteNonQuery();
            }

            // 7. Insert Notification for employee
            using (var cmdNotif = conn.CreateCommand())
            {
                cmdNotif.Transaction = tx;
                cmdNotif.CommandText = @"
                    INSERT INTO notifications (UserId, Title, Message, Type, TransferId, CreatedAt)
                    VALUES (@uid, 'Quyết định điều chuyển đã hoàn tất', @msg, 'success', @trfId, CURRENT_TIMESTAMP);
                ";
                cmdNotif.Parameters.AddWithValue("@uid", trf.EmployeeId);
                cmdNotif.Parameters.AddWithValue("@msg", $"Hồ sơ điều chuyển mã {trf.TransferCode} đã chính thức có hiệu lực.");
                cmdNotif.Parameters.AddWithValue("@trfId", trf.TransferId);
                cmdNotif.ExecuteNonQuery();
            }

            tx.Commit();
            return true;
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    private static TransferDetailDto MapDetail(SqliteDataReader reader)
    {
        return new TransferDetailDto
        {
            TransferId = reader.GetInt32(reader.GetOrdinal("TransferId")),
            TransferCode = reader.GetString(reader.GetOrdinal("TransferCode")),
            BatchCode = reader.IsDBNull(reader.GetOrdinal("BatchCode")) ? null : reader.GetString(reader.GetOrdinal("BatchCode")),
            EmployeeId = reader.GetInt32(reader.GetOrdinal("EmployeeId")),
            EmployeeName = reader.GetString(reader.GetOrdinal("EmployeeName")),
            EmployeeCode = reader.GetString(reader.GetOrdinal("EmployeeCode")),
            EmployeeEmail = reader.GetString(reader.GetOrdinal("EmployeeEmail")),
            FromDepartmentId = reader.GetInt32(reader.GetOrdinal("FromDepartmentId")),
            FromDepartmentName = reader.GetString(reader.GetOrdinal("FromDepartmentName")),
            ToDepartmentId = reader.GetInt32(reader.GetOrdinal("ToDepartmentId")),
            ToDepartmentName = reader.GetString(reader.GetOrdinal("ToDepartmentName")),
            FromPositionId = reader.GetInt32(reader.GetOrdinal("FromPositionId")),
            FromPositionName = reader.GetString(reader.GetOrdinal("FromPositionName")),
            ToPositionId = reader.GetInt32(reader.GetOrdinal("ToPositionId")),
            ToPositionName = reader.GetString(reader.GetOrdinal("ToPositionName")),
            FromManagerId = reader.IsDBNull(reader.GetOrdinal("FromManagerId")) ? null : reader.GetInt32(reader.GetOrdinal("FromManagerId")),
            FromManagerName = reader.IsDBNull(reader.GetOrdinal("FromManagerName")) ? null : reader.GetString(reader.GetOrdinal("FromManagerName")),
            ToManagerId = reader.IsDBNull(reader.GetOrdinal("ToManagerId")) ? null : reader.GetInt32(reader.GetOrdinal("ToManagerId")),
            ToManagerName = reader.IsDBNull(reader.GetOrdinal("ToManagerName")) ? null : reader.GetString(reader.GetOrdinal("ToManagerName")),
            TransferType = reader.GetString(reader.GetOrdinal("TransferType")),
            EffectiveDate = reader.GetString(reader.GetOrdinal("EffectiveDate")),
            ReturnDate = reader.IsDBNull(reader.GetOrdinal("ReturnDate")) ? null : reader.GetString(reader.GetOrdinal("ReturnDate")),
            Reason = reader.GetString(reader.GetOrdinal("Reason")),
            Notes = reader.IsDBNull(reader.GetOrdinal("Notes")) ? null : reader.GetString(reader.GetOrdinal("Notes")),
            AttachmentsJson = reader.IsDBNull(reader.GetOrdinal("AttachmentsJson")) ? null : reader.GetString(reader.GetOrdinal("AttachmentsJson")),
            Status = reader.GetString(reader.GetOrdinal("Status")),
            EmployeeConsent = reader.GetString(reader.GetOrdinal("EmployeeConsent")),
            ConsentComment = reader.IsDBNull(reader.GetOrdinal("ConsentComment")) ? null : reader.GetString(reader.GetOrdinal("ConsentComment")),
            InitiatorId = reader.IsDBNull(reader.GetOrdinal("InitiatorId")) ? null : reader.GetInt32(reader.GetOrdinal("InitiatorId")),
            InitiatorRole = reader.GetString(reader.GetOrdinal("InitiatorRole")),
            CreatedAt = reader.GetString(reader.GetOrdinal("CreatedAt")),
            UpdatedAt = reader.GetString(reader.GetOrdinal("UpdatedAt"))
        };
    }
}
