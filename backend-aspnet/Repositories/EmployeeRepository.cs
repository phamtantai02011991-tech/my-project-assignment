using System.Data;
using EmployeeTransferApi.Data;
using EmployeeTransferApi.Dtos;
using EmployeeTransferApi.Entities;
using Microsoft.Data.Sqlite;

namespace EmployeeTransferApi.Repositories;

public interface IEmployeeRepository
{
    Employee? GetById(int id);
    Employee? GetByEmail(string email);
    List<UserProfileDto> GetAllProfiles();
    List<UserProfileDto> GetManagedProfiles(int managerId);
    List<Department> GetDepartments();
    List<Position> GetPositions();
    List<EmploymentHistory> GetEmploymentHistory(int employeeId);
    bool CreateEmployee(Employee employee);
}

public class EmployeeRepository : IEmployeeRepository
{
    private readonly SqliteDbConnection _db;

    public EmployeeRepository(SqliteDbConnection db)
    {
        _db = db;
    }

    public Employee? GetById(int id)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM employees WHERE EmployeeId = @id LIMIT 1;";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        if (reader.Read()) return MapEmployee(reader);
        return null;
    }

    public Employee? GetByEmail(string email)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM employees WHERE LOWER(Email) = LOWER(@email) LIMIT 1;";
        cmd.Parameters.AddWithValue("@email", email);
        using var reader = cmd.ExecuteReader();
        if (reader.Read()) return MapEmployee(reader);
        return null;
    }

    public List<UserProfileDto> GetAllProfiles()
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT e.EmployeeId, e.EmployeeCode, e.FullName, e.Email, e.Role, e.EmploymentStatus,
                   e.DepartmentId, d.DepartmentName, e.PositionId, p.PositionName,
                   e.ManagerId, m.FullName as ManagerName
            FROM employees e
            LEFT JOIN departments d ON e.DepartmentId = d.DepartmentId
            LEFT JOIN positions p ON e.PositionId = p.PositionId
            LEFT JOIN employees m ON e.ManagerId = m.EmployeeId
            ORDER BY e.EmployeeId ASC;
        ";
        using var reader = cmd.ExecuteReader();
        var list = new List<UserProfileDto>();
        while (reader.Read()) list.Add(MapProfile(reader));
        return list;
    }

    public List<UserProfileDto> GetManagedProfiles(int managerId)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT e.EmployeeId, e.EmployeeCode, e.FullName, e.Email, e.Role, e.EmploymentStatus,
                   e.DepartmentId, d.DepartmentName, e.PositionId, p.PositionName,
                   e.ManagerId, m.FullName as ManagerName
            FROM employees e
            LEFT JOIN departments d ON e.DepartmentId = d.DepartmentId
            LEFT JOIN positions p ON e.PositionId = p.PositionId
            LEFT JOIN employees m ON e.ManagerId = m.EmployeeId
            WHERE e.ManagerId = @mgrId OR e.DepartmentId = (SELECT DepartmentId FROM employees WHERE EmployeeId = @mgrId)
            ORDER BY e.EmployeeId ASC;
        ";
        cmd.Parameters.AddWithValue("@mgrId", managerId);
        using var reader = cmd.ExecuteReader();
        var list = new List<UserProfileDto>();
        while (reader.Read()) list.Add(MapProfile(reader));
        return list;
    }

    public List<Department> GetDepartments()
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM departments WHERE IsActive = 1 ORDER BY DepartmentId ASC;";
        using var reader = cmd.ExecuteReader();
        var list = new List<Department>();
        while (reader.Read())
        {
            list.Add(new Department
            {
                DepartmentId = reader.GetInt32(0),
                DepartmentCode = reader.GetString(1),
                DepartmentName = reader.GetString(2),
                ParentDepartmentId = reader.IsDBNull(3) ? null : reader.GetInt32(3),
                Description = reader.IsDBNull(4) ? null : reader.GetString(4),
                IsActive = reader.GetInt32(5)
            });
        }
        return list;
    }

    public List<Position> GetPositions()
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM positions WHERE IsActive = 1 ORDER BY PositionId ASC;";
        using var reader = cmd.ExecuteReader();
        var list = new List<Position>();
        while (reader.Read())
        {
            list.Add(new Position
            {
                PositionId = reader.GetInt32(0),
                PositionCode = reader.GetString(1),
                PositionName = reader.GetString(2),
                DepartmentId = reader.GetInt32(3),
                Description = reader.IsDBNull(4) ? null : reader.GetString(4),
                IsActive = reader.GetInt32(5)
            });
        }
        return list;
    }

    public List<EmploymentHistory> GetEmploymentHistory(int employeeId)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM employment_histories WHERE EmployeeId = @empId ORDER BY HistoryId DESC;";
        cmd.Parameters.AddWithValue("@empId", employeeId);
        using var reader = cmd.ExecuteReader();
        var list = new List<EmploymentHistory>();
        while (reader.Read())
        {
            list.Add(new EmploymentHistory
            {
                HistoryId = reader.GetInt32(0),
                EmployeeId = reader.GetInt32(1),
                TransferId = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                DepartmentId = reader.GetInt32(3),
                PositionId = reader.GetInt32(4),
                ManagerId = reader.IsDBNull(5) ? null : reader.GetInt32(5),
                StartDate = reader.GetString(6),
                EndDate = reader.IsDBNull(7) ? null : reader.GetString(7),
                ChangeType = reader.GetString(8),
                Reason = reader.IsDBNull(9) ? null : reader.GetString(9),
                CreatedAt = reader.GetString(10)
            });
        }
        return list;
    }

    public bool CreateEmployee(Employee employee)
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO employees (EmployeeCode, FullName, Email, PasswordHash, Role, Phone, DepartmentId, PositionId, ManagerId, HireDate, EmploymentStatus)
            VALUES (@code, @name, @email, @hash, @role, @phone, @dept, @pos, @mgr, @hire, @status);
        ";
        cmd.Parameters.AddWithValue("@code", employee.EmployeeCode);
        cmd.Parameters.AddWithValue("@name", employee.FullName);
        cmd.Parameters.AddWithValue("@email", employee.Email);
        cmd.Parameters.AddWithValue("@hash", employee.PasswordHash);
        cmd.Parameters.AddWithValue("@role", employee.Role);
        cmd.Parameters.AddWithValue("@phone", (object?)employee.Phone ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@dept", employee.DepartmentId);
        cmd.Parameters.AddWithValue("@pos", employee.PositionId);
        cmd.Parameters.AddWithValue("@mgr", (object?)employee.ManagerId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@hire", DateTime.UtcNow.ToString("yyyy-MM-dd"));
        cmd.Parameters.AddWithValue("@status", "Active");
        return cmd.ExecuteNonQuery() > 0;
    }

    private static Employee MapEmployee(SqliteDataReader reader)
    {
        return new Employee
        {
            EmployeeId = reader.GetInt32(reader.GetOrdinal("EmployeeId")),
            EmployeeCode = reader.GetString(reader.GetOrdinal("EmployeeCode")),
            FullName = reader.GetString(reader.GetOrdinal("FullName")),
            Email = reader.GetString(reader.GetOrdinal("Email")),
            PasswordHash = reader.GetString(reader.GetOrdinal("PasswordHash")),
            Role = reader.GetString(reader.GetOrdinal("Role")),
            Phone = reader.IsDBNull(reader.GetOrdinal("Phone")) ? null : reader.GetString(reader.GetOrdinal("Phone")),
            DepartmentId = reader.GetInt32(reader.GetOrdinal("DepartmentId")),
            PositionId = reader.GetInt32(reader.GetOrdinal("PositionId")),
            ManagerId = reader.IsDBNull(reader.GetOrdinal("ManagerId")) ? null : reader.GetInt32(reader.GetOrdinal("ManagerId")),
            HireDate = reader.IsDBNull(reader.GetOrdinal("HireDate")) ? null : reader.GetString(reader.GetOrdinal("HireDate")),
            EmploymentStatus = reader.GetString(reader.GetOrdinal("EmploymentStatus"))
        };
    }

    private static UserProfileDto MapProfile(SqliteDataReader reader)
    {
        return new UserProfileDto
        {
            EmployeeId = reader.GetInt32(reader.GetOrdinal("EmployeeId")),
            EmployeeCode = reader.GetString(reader.GetOrdinal("EmployeeCode")),
            FullName = reader.GetString(reader.GetOrdinal("FullName")),
            Email = reader.GetString(reader.GetOrdinal("Email")),
            Role = reader.GetString(reader.GetOrdinal("Role")),
            EmploymentStatus = reader.GetString(reader.GetOrdinal("EmploymentStatus")),
            DepartmentId = reader.GetInt32(reader.GetOrdinal("DepartmentId")),
            DepartmentName = reader.IsDBNull(reader.GetOrdinal("DepartmentName")) ? "" : reader.GetString(reader.GetOrdinal("DepartmentName")),
            PositionId = reader.GetInt32(reader.GetOrdinal("PositionId")),
            PositionName = reader.IsDBNull(reader.GetOrdinal("PositionName")) ? "" : reader.GetString(reader.GetOrdinal("PositionName")),
            ManagerId = reader.IsDBNull(reader.GetOrdinal("ManagerId")) ? null : reader.GetInt32(reader.GetOrdinal("ManagerId")),
            ManagerName = reader.IsDBNull(reader.GetOrdinal("ManagerName")) ? null : reader.GetString(reader.GetOrdinal("ManagerName"))
        };
    }
}
