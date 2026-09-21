using System.Security.Claims;
using EmployeeTransferApi.Dtos;
using EmployeeTransferApi.Entities;
using EmployeeTransferApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeTransferApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeRepository _empRepo;

    public EmployeesController(IEmployeeRepository empRepo)
    {
        _empRepo = empRepo;
    }

    [HttpGet]
    public ActionResult<ApiResponse<List<UserProfileDto>>> GetAll()
    {
        var list = _empRepo.GetAllProfiles();
        return Ok(new ApiResponse<List<UserProfileDto>> { Success = true, Data = list });
    }

    [HttpGet("{id}")]
    public ActionResult<ApiResponse<UserProfileDto>> GetById(int id)
    {
        var profile = _empRepo.GetAllProfiles().FirstOrDefault(p => p.EmployeeId == id);
        if (profile == null)
            return NotFound(new ApiResponse<UserProfileDto> { Success = false, Message = "Không tìm thấy nhân sự." });

        return Ok(new ApiResponse<UserProfileDto> { Success = true, Data = profile });
    }

    [HttpGet("{id}/history")]
    public ActionResult<ApiResponse<List<EmploymentHistory>>> GetEmploymentHistory(int id)
    {
        var list = _empRepo.GetEmploymentHistory(id);
        return Ok(new ApiResponse<List<EmploymentHistory>> { Success = true, Data = list });
    }

    [HttpGet("managed")]
    [Authorize(Roles = "manager,hr,admin")]
    public ActionResult<ApiResponse<List<UserProfileDto>>> GetManagedEmployees()
    {
        var uidStr = User.FindFirstValue("employeeId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0";
        int.TryParse(uidStr, out int managerId);

        var list = _empRepo.GetManagedProfiles(managerId);
        return Ok(new ApiResponse<List<UserProfileDto>> { Success = true, Data = list });
    }

    /// <summary>
    /// CRITICAL INVARIANT ENFORCEMENT:
    /// Direct mutation of DepartmentId, PositionId, or ManagerId is strictly prohibited!
    /// </summary>
    [HttpPut("{id}")]
    public ActionResult RejectDirectOrganizationalModification(int id)
    {
        return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<object>
        {
            Success = false,
            Message = "CRITICAL_INVARIANT_VIOLATION: Hệ thống tuyệt đối không cho phép sửa đổi trực tiếp DepartmentId, PositionId, ManagerId. Mọi thay đổi tổ chức nhân sự bắt buộc phải thông qua Transfer Workflow."
        });
    }
}
