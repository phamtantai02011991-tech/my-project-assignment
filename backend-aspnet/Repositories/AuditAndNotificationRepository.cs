using EmployeeTransferApi.Data;
using EmployeeTransferApi.Entities;
using Microsoft.Data.Sqlite;

namespace EmployeeTransferApi.Repositories;

public interface IAuditAndNotificationRepository
{
    List<AuditLog> GetAuditLogs(int limit = 100);
    void InsertAudit(int? userId, string? userEmail, string action, string entityType, int? entityId, string? oldVal, string? newVal);
    List<Notification> GetNotificationsForUser(int userId);
    bool MarkNotificationAsRead(int notificationId, int userId);
    void InsertNotification(int userId, string title, string message, string type = "info", int? transferId = null);
}

public class AuditAndNotificationRepository : IAuditAndNotificationRepository
{
    private readonly SqliteDbConnection _db;

    public AuditAndNotificationRepository(SqliteDbConnection db)
    {
        _db = db;
    }

    public List<AuditLog> GetAuditLogs(int limit = 100)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM audit_logs ORDER BY LogId DESC LIMIT @lim;";
        cmd.Parameters.AddWithValue("@lim", limit);
        using var reader = cmd.ExecuteReader();
        var list = new List<AuditLog>();
        while (reader.Read())
        {
            list.Add(new AuditLog
            {
                LogId = reader.GetInt32(reader.GetOrdinal("LogId")),
                UserId = reader.IsDBNull(reader.GetOrdinal("UserId")) ? null : reader.GetInt32(reader.GetOrdinal("UserId")),
                UserEmail = reader.IsDBNull(reader.GetOrdinal("UserEmail")) ? null : reader.GetString(reader.GetOrdinal("UserEmail")),
                Action = reader.GetString(reader.GetOrdinal("Action")),
                EntityType = reader.GetString(reader.GetOrdinal("EntityType")),
                EntityId = reader.IsDBNull(reader.GetOrdinal("EntityId")) ? null : reader.GetInt32(reader.GetOrdinal("EntityId")),
                OldValues = reader.IsDBNull(reader.GetOrdinal("OldValues")) ? null : reader.GetString(reader.GetOrdinal("OldValues")),
                NewValues = reader.IsDBNull(reader.GetOrdinal("NewValues")) ? null : reader.GetString(reader.GetOrdinal("NewValues")),
                IpAddress = reader.IsDBNull(reader.GetOrdinal("IpAddress")) ? null : reader.GetString(reader.GetOrdinal("IpAddress")),
                CreatedAt = reader.GetString(reader.GetOrdinal("CreatedAt"))
            });
        }
        return list;
    }

    public void InsertAudit(int? userId, string? userEmail, string action, string entityType, int? entityId, string? oldVal, string? newVal)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO audit_logs (UserId, UserEmail, Action, EntityType, EntityId, OldValues, NewValues, CreatedAt)
            VALUES (@uid, @email, @act, @ent, @eid, @old, @new, CURRENT_TIMESTAMP);
        ";
        cmd.Parameters.AddWithValue("@uid", (object?)userId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@email", (object?)userEmail ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@act", action);
        cmd.Parameters.AddWithValue("@ent", entityType);
        cmd.Parameters.AddWithValue("@eid", (object?)entityId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@old", (object?)oldVal ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@new", (object?)newVal ?? DBNull.Value);
        cmd.ExecuteNonQuery();
    }

    public List<Notification> GetNotificationsForUser(int userId)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM notifications WHERE UserId = @uid ORDER BY NotificationId DESC LIMIT 50;";
        cmd.Parameters.AddWithValue("@uid", userId);
        using var reader = cmd.ExecuteReader();
        var list = new List<Notification>();
        while (reader.Read())
        {
            list.Add(new Notification
            {
                NotificationId = reader.GetInt32(reader.GetOrdinal("NotificationId")),
                UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                Title = reader.GetString(reader.GetOrdinal("Title")),
                Message = reader.GetString(reader.GetOrdinal("Message")),
                Type = reader.GetString(reader.GetOrdinal("Type")),
                IsRead = reader.GetInt32(reader.GetOrdinal("IsRead")),
                TransferId = reader.IsDBNull(reader.GetOrdinal("TransferId")) ? null : reader.GetInt32(reader.GetOrdinal("TransferId")),
                CreatedAt = reader.GetString(reader.GetOrdinal("CreatedAt"))
            });
        }
        return list;
    }

    public bool MarkNotificationAsRead(int notificationId, int userId)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "UPDATE notifications SET IsRead = 1 WHERE NotificationId = @nid AND UserId = @uid;";
        cmd.Parameters.AddWithValue("@nid", notificationId);
        cmd.Parameters.AddWithValue("@uid", userId);
        return cmd.ExecuteNonQuery() > 0;
    }

    public void InsertNotification(int userId, string title, string message, string type = "info", int? transferId = null)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO notifications (UserId, Title, Message, Type, IsRead, TransferId, CreatedAt)
            VALUES (@uid, @title, @msg, @type, 0, @trf, CURRENT_TIMESTAMP);
        ";
        cmd.Parameters.AddWithValue("@uid", userId);
        cmd.Parameters.AddWithValue("@title", title);
        cmd.Parameters.AddWithValue("@msg", message);
        cmd.Parameters.AddWithValue("@type", type);
        cmd.Parameters.AddWithValue("@trf", (object?)transferId ?? DBNull.Value);
        cmd.ExecuteNonQuery();
    }
}
