using BCrypt.Net;
using Microsoft.Data.Sqlite;

namespace EmployeeTransferApi.Data;

public class DatabaseInitializer
{
    private readonly SqliteDbConnection _db;
    private readonly ILogger<DatabaseInitializer> _logger;

    public DatabaseInitializer(SqliteDbConnection db, ILogger<DatabaseInitializer> logger)
    {
        _db = db;
        _logger = logger;
    }

    public void Initialize()
    {
        using var conn = _db.CreateConnection();
        using var cmd = conn.CreateCommand();

        cmd.CommandText = @"
            -- 1. ROLES
            CREATE TABLE IF NOT EXISTS roles (
                RoleId INTEGER PRIMARY KEY AUTOINCREMENT,
                RoleName TEXT UNIQUE NOT NULL,
                Description TEXT
            );

            -- 2. DEPARTMENTS
            CREATE TABLE IF NOT EXISTS departments (
                DepartmentId INTEGER PRIMARY KEY AUTOINCREMENT,
                DepartmentCode TEXT UNIQUE NOT NULL,
                DepartmentName TEXT NOT NULL,
                ParentDepartmentId INTEGER,
                Description TEXT,
                IsActive INTEGER DEFAULT 1,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ParentDepartmentId) REFERENCES departments(DepartmentId)
            );

            -- 3. POSITIONS
            CREATE TABLE IF NOT EXISTS positions (
                PositionId INTEGER PRIMARY KEY AUTOINCREMENT,
                PositionCode TEXT UNIQUE NOT NULL,
                PositionName TEXT NOT NULL,
                DepartmentId INTEGER NOT NULL,
                Description TEXT,
                IsActive INTEGER DEFAULT 1,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (DepartmentId) REFERENCES departments(DepartmentId)
            );

            -- 4. EMPLOYEES
            CREATE TABLE IF NOT EXISTS employees (
                EmployeeId INTEGER PRIMARY KEY AUTOINCREMENT,
                EmployeeCode TEXT UNIQUE NOT NULL,
                FullName TEXT NOT NULL,
                Email TEXT UNIQUE NOT NULL,
                PasswordHash TEXT NOT NULL,
                Role TEXT NOT NULL CHECK(Role IN ('employee', 'manager', 'hr', 'admin')),
                Phone TEXT,
                DepartmentId INTEGER NOT NULL,
                PositionId INTEGER NOT NULL,
                ManagerId INTEGER,
                HireDate TEXT,
                EmploymentStatus TEXT DEFAULT 'Active',
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (DepartmentId) REFERENCES departments(DepartmentId),
                FOREIGN KEY (PositionId) REFERENCES positions(PositionId),
                FOREIGN KEY (ManagerId) REFERENCES employees(EmployeeId)
            );

            -- 5. DEPARTMENT TRANSFERS
            CREATE TABLE IF NOT EXISTS department_transfers (
                TransferId INTEGER PRIMARY KEY AUTOINCREMENT,
                TransferCode TEXT UNIQUE NOT NULL,
                BatchCode TEXT,
                EmployeeId INTEGER NOT NULL,
                FromDepartmentId INTEGER NOT NULL,
                ToDepartmentId INTEGER NOT NULL,
                FromPositionId INTEGER NOT NULL,
                ToPositionId INTEGER NOT NULL,
                FromManagerId INTEGER,
                ToManagerId INTEGER,
                TransferType TEXT NOT NULL,
                EffectiveDate TEXT NOT NULL,
                ReturnDate TEXT,
                Reason TEXT NOT NULL,
                Notes TEXT,
                AttachmentsJson TEXT,
                Status TEXT NOT NULL DEFAULT 'PendingApproval',
                EmployeeConsent TEXT DEFAULT 'Accepted',
                ConsentComment TEXT,
                InitiatorId INTEGER,
                InitiatorRole TEXT DEFAULT 'employee',
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (EmployeeId) REFERENCES employees(EmployeeId),
                FOREIGN KEY (FromDepartmentId) REFERENCES departments(DepartmentId),
                FOREIGN KEY (ToDepartmentId) REFERENCES departments(DepartmentId),
                FOREIGN KEY (FromPositionId) REFERENCES positions(PositionId),
                FOREIGN KEY (ToPositionId) REFERENCES positions(PositionId)
            );

            -- 6. TRANSFER APPROVALS
            CREATE TABLE IF NOT EXISTS transfer_approvals (
                ApprovalId INTEGER PRIMARY KEY AUTOINCREMENT,
                TransferId INTEGER NOT NULL,
                ApproverId INTEGER NOT NULL,
                ApproverRole TEXT NOT NULL,
                ApprovalLevel INTEGER NOT NULL,
                Status TEXT NOT NULL DEFAULT 'Pending',
                Comment TEXT,
                ActionDate DATETIME,
                FOREIGN KEY (TransferId) REFERENCES department_transfers(TransferId) ON DELETE CASCADE,
                FOREIGN KEY (ApproverId) REFERENCES employees(EmployeeId)
            );

            -- 7. EMPLOYMENT HISTORIES
            CREATE TABLE IF NOT EXISTS employment_histories (
                HistoryId INTEGER PRIMARY KEY AUTOINCREMENT,
                EmployeeId INTEGER NOT NULL,
                TransferId INTEGER,
                DepartmentId INTEGER NOT NULL,
                PositionId INTEGER NOT NULL,
                ManagerId INTEGER,
                StartDate TEXT NOT NULL,
                EndDate TEXT,
                ChangeType TEXT DEFAULT 'Initial',
                Reason TEXT,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (EmployeeId) REFERENCES employees(EmployeeId),
                FOREIGN KEY (TransferId) REFERENCES department_transfers(TransferId),
                FOREIGN KEY (DepartmentId) REFERENCES departments(DepartmentId),
                FOREIGN KEY (PositionId) REFERENCES positions(PositionId)
            );

            -- 8. AUDIT LOGS
            CREATE TABLE IF NOT EXISTS audit_logs (
                LogId INTEGER PRIMARY KEY AUTOINCREMENT,
                UserId INTEGER,
                UserEmail TEXT,
                Action TEXT NOT NULL,
                EntityType TEXT NOT NULL,
                EntityId INTEGER,
                OldValues TEXT,
                NewValues TEXT,
                IpAddress TEXT,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- 9. NOTIFICATIONS
            CREATE TABLE IF NOT EXISTS notifications (
                NotificationId INTEGER PRIMARY KEY AUTOINCREMENT,
                UserId INTEGER NOT NULL,
                Title TEXT NOT NULL,
                Message TEXT NOT NULL,
                Type TEXT DEFAULT 'info',
                IsRead INTEGER DEFAULT 0,
                TransferId INTEGER,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (UserId) REFERENCES employees(EmployeeId)
            );
        ";
        cmd.ExecuteNonQuery();

        SeedInitialData(conn);
        _logger.LogInformation("Database Initialized successfully with 9 ERD tables.");
    }

    private void SeedInitialData(SqliteConnection conn)
    {
        // Check if data already seeded
        using var checkCmd = conn.CreateCommand();
        checkCmd.CommandText = "SELECT COUNT(*) FROM roles;";
        var roleCount = Convert.ToInt32(checkCmd.ExecuteScalar());
        if (roleCount > 0) return;

        using var tx = conn.BeginTransaction();

        // 1. Roles
        using var roleCmd = conn.CreateCommand();
        roleCmd.Transaction = tx;
        roleCmd.CommandText = @"
            INSERT INTO roles (RoleId, RoleName, Description) VALUES
            (1, 'employee', 'Nhân viên thực thi công việc'),
            (2, 'manager', 'Trưởng phòng / Quản lý trực tiếp'),
            (3, 'hr', 'Chuyên viên Nhân sự & Quản trị quy trình'),
            (4, 'admin', 'Ban Giám Đốc / Quản trị viên hệ thống');
        ";
        roleCmd.ExecuteNonQuery();

        // 2. Departments
        using var deptCmd = conn.CreateCommand();
        deptCmd.Transaction = tx;
        deptCmd.CommandText = @"
            INSERT INTO departments (DepartmentId, DepartmentCode, DepartmentName, Description) VALUES
            (1, 'EXEC', 'Ban Giám Đốc', 'Hội đồng Quản trị & Điều hành Doanh nghiệp'),
            (2, 'TECH', 'Khối Kỹ Thuật & Công Nghệ', 'Phát triển phần mềm, hạ tầng kỹ thuật'),
            (3, 'SALES', 'Khối Kinh Doanh & Tiếp Thị', 'Kinh doanh, tìm kiếm đối tác và tiếp thị'),
            (4, 'HR', 'Khối Quản Trị Nhân Sự', 'Tuyển dụng, đào tạo và quản lý nhân sự');
        ";
        deptCmd.ExecuteNonQuery();

        // 3. Positions
        using var posCmd = conn.CreateCommand();
        posCmd.Transaction = tx;
        posCmd.CommandText = @"
            INSERT INTO positions (PositionId, PositionCode, PositionName, DepartmentId, Description) VALUES
            (1, 'CEO', 'Giám Đốc Điều Hành', 1, 'Lãnh đạo toàn diện công ty'),
            (2, 'TECH_LEAD', 'Trưởng Phòng Kỹ Thuật', 2, 'Quản lý dự án & kỹ thuật'),
            (3, 'DEV_SR', 'Lập Trình Viên Cao Cấp', 2, 'Phát triển hệ thống cốt lõi'),
            (4, 'SALES_MGR', 'Trưởng Phòng Kinh Doanh', 3, 'Quản lý đội ngũ kinh doanh'),
            (5, 'SALES_SPEC', 'Chuyên Viên Kinh Doanh', 3, 'Chăm sóc khách hàng & mở rộng thị trường'),
            (6, 'HR_SPEC', 'Chuyên Viên Nhân Sự', 4, 'Điều chuyển nhân sự & quản trị phúc lợi');
        ";
        posCmd.ExecuteNonQuery();

        // Hash Pass@123
        var passHash = BCrypt.Net.BCrypt.HashPassword("Pass@123");

        // 4. Employees
        using var empCmd = conn.CreateCommand();
        empCmd.Transaction = tx;
        empCmd.CommandText = @"
            INSERT INTO employees (EmployeeId, EmployeeCode, FullName, Email, PasswordHash, Role, Phone, DepartmentId, PositionId, ManagerId, HireDate, EmploymentStatus) VALUES
            (1, 'EMP001', 'Nguyễn Văn A', 'employee@enterprise.com', @p, 'employee', '0901111111', 2, 3, 2, '2023-01-15', 'Active'),
            (2, 'EMP002', 'Trần Văn B', 'manager@enterprise.com', @p, 'manager', '0902222222', 2, 2, 5, '2021-03-01', 'Active'),
            (3, 'EMP003', 'Hoàng Văn D', 'sales_manager@enterprise.com', @p, 'manager', '0903333333', 3, 4, 5, '2021-06-15', 'Active'),
            (4, 'EMP004', 'Lê Thị C', 'hr@enterprise.com', @p, 'hr', '0904444444', 4, 6, 5, '2022-02-10', 'Active'),
            (5, 'EMP005', 'Phạm Văn E', 'admin@enterprise.com', @p, 'admin', '0905555555', 1, 1, NULL, '2020-01-01', 'Active');
        ";
        empCmd.Parameters.AddWithValue("@p", passHash);
        empCmd.ExecuteNonQuery();

        // 5. Initial Employment Histories
        using var histCmd = conn.CreateCommand();
        histCmd.Transaction = tx;
        histCmd.CommandText = @"
            INSERT INTO employment_histories (EmployeeId, DepartmentId, PositionId, ManagerId, StartDate, ChangeType, Reason) VALUES
            (1, 2, 3, 2, '2023-01-15', 'Initial', 'Gia nhập công ty - Vị trí Lập trình viên'),
            (2, 2, 2, 5, '2021-03-01', 'Initial', 'Bổ nhiệm Trưởng Phòng Kỹ Thuật'),
            (3, 3, 4, 5, '2021-06-15', 'Initial', 'Bổ nhiệm Trưởng Phòng Kinh Doanh'),
            (4, 4, 6, 5, '2022-02-10', 'Initial', 'Gia nhập Khối Nhân Sự'),
            (5, 1, 1, NULL, '2020-01-01', 'Initial', 'Ban Điều Hành');
        ";
        histCmd.ExecuteNonQuery();

        tx.Commit();
        _logger.LogInformation("Initial seed data inserted: 4 Departments, 6 Positions, 5 Employees, 0 Transfers.");
    }
}
