using System.Security.Claims;
using EmployeeTransferApi.Dtos;
using EmployeeTransferApi.Entities;
using EmployeeTransferApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeTransferApi.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = "hr,admin")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditAndNotificationRepository _auditRepo;

    public AuditLogsController(IAuditAndNotificationRepository auditRepo)
    {
        _auditRepo = auditRepo;
    }

    [HttpGet]
    public ActionResult<ApiResponse<List<AuditLog>>> GetAuditLogs([FromQuery] int limit = 100)
    {
        var logs = _auditRepo.GetAuditLogs(limit);
        return Ok(new ApiResponse<List<AuditLog>> { Success = true, Data = logs });
    }
}

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IAuditAndNotificationRepository _auditRepo;

    public NotificationsController(IAuditAndNotificationRepository auditRepo)
    {
        _auditRepo = auditRepo;
    }

    [HttpGet]
    public ActionResult<ApiResponse<List<Notification>>> GetMyNotifications()
    {
        var uidStr = User.FindFirstValue("employeeId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0";
        int.TryParse(uidStr, out int userId);

        var list = _auditRepo.GetNotificationsForUser(userId);
        return Ok(new ApiResponse<List<Notification>> { Success = true, Data = list });
    }

    [HttpPut("{id}/read")]
    public ActionResult<ApiResponse<bool>> MarkAsRead(int id)
    {
        var uidStr = User.FindFirstValue("employeeId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0";
        int.TryParse(uidStr, out int userId);

        var success = _auditRepo.MarkNotificationAsRead(id, userId);
        return Ok(new ApiResponse<bool> { Success = success, Data = success });
    }
}
