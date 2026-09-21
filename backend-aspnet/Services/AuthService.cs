using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using EmployeeTransferApi.Dtos;
using EmployeeTransferApi.Entities;
using EmployeeTransferApi.Repositories;
using Microsoft.IdentityModel.Tokens;

namespace EmployeeTransferApi.Services;

public interface IAuthService
{
    AuthResponseDto? Login(LoginRequestDto request);
    AuthResponseDto Register(RegisterRequestDto request);
    UserProfileDto? GetProfileById(int employeeId);
}

public class AuthService : IAuthService
{
    private readonly IEmployeeRepository _empRepo;
    private readonly IAuditAndNotificationRepository _auditRepo;
    private readonly IConfiguration _config;

    public AuthService(IEmployeeRepository empRepo, IAuditAndNotificationRepository auditRepo, IConfiguration config)
    {
        _empRepo = empRepo;
        _auditRepo = auditRepo;
        _config = config;
    }

    public AuthResponseDto? Login(LoginRequestDto request)
    {
        var emp = _empRepo.GetByEmail(request.Email);
        if (emp == null) return null;

        bool isPassValid = BCrypt.Net.BCrypt.Verify(request.Password, emp.PasswordHash);
        if (!isPassValid) return null;

        var token = GenerateJwtToken(emp);
        var profile = _empRepo.GetAllProfiles().FirstOrDefault(p => p.EmployeeId == emp.EmployeeId);

        _auditRepo.InsertAudit(emp.EmployeeId, emp.Email, "USER_LOGIN", "Employee", emp.EmployeeId, null, "Successful login");

        return new AuthResponseDto
        {
            Token = token,
            User = profile ?? new UserProfileDto
            {
                EmployeeId = emp.EmployeeId,
                EmployeeCode = emp.EmployeeCode,
                FullName = emp.FullName,
                Email = emp.Email,
                Role = emp.Role,
                DepartmentId = emp.DepartmentId,
                PositionId = emp.PositionId
            }
        };
    }

    public AuthResponseDto Register(RegisterRequestDto request)
    {
        var existing = _empRepo.GetByEmail(request.Email);
        if (existing != null)
        {
            throw new InvalidOperationException("Email đã tồn tại trong hệ thống.");
        }

        var hash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var code = "EMP" + Random.Shared.Next(100, 999);

        var emp = new Employee
        {
            EmployeeCode = code,
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = hash,
            Role = request.Role,
            DepartmentId = request.DepartmentId,
            PositionId = request.PositionId,
            ManagerId = request.ManagerId,
            Phone = request.Phone,
            EmploymentStatus = "Active"
        };

        _empRepo.CreateEmployee(emp);
        var created = _empRepo.GetByEmail(request.Email)!;

        _auditRepo.InsertAudit(created.EmployeeId, created.Email, "USER_REGISTER", "Employee", created.EmployeeId, null, $"Registered role {created.Role}");

        return Login(new LoginRequestDto { Email = request.Email, Password = request.Password })!;
    }

    public UserProfileDto? GetProfileById(int employeeId)
    {
        return _empRepo.GetAllProfiles().FirstOrDefault(p => p.EmployeeId == employeeId);
    }

    private string GenerateJwtToken(Employee emp)
    {
        var secret = _config["Jwt:Key"] ?? "workflow_super_secret_jwt_key_2026_dev_team_min_32_bytes!";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, emp.EmployeeId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, emp.Email),
            new Claim("name", emp.FullName),
            new Claim("role", emp.Role),
            new Claim("employeeId", emp.EmployeeId.ToString()),
            new Claim("departmentId", emp.DepartmentId.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "EmployeeTransferApi",
            audience: _config["Jwt:Audience"] ?? "EmployeeTransferClients",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
