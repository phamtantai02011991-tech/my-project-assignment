using System.Security.Claims;
using EmployeeTransferApi.Dtos;
using EmployeeTransferApi.Repositories;
using EmployeeTransferApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeTransferApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransfersController : ControllerBase
{
    private readonly ITransferService _transferService;
    private readonly ITransferRepository _trfRepo;

    public TransfersController(ITransferService transferService, ITransferRepository trfRepo)
    {
        _transferService = transferService;
        _trfRepo = trfRepo;
    }

    private string GetCurrentRole() =>
        User.FindFirstValue("role") ?? User.FindFirstValue(ClaimTypes.Role) ?? "employee";

    private int GetCurrentUserId()
    {
        var uidStr = User.FindFirstValue("employeeId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "0";
        int.TryParse(uidStr, out int id);
        return id;
    }

    [HttpGet]
    public ActionResult<ApiResponse<List<TransferDetailDto>>> GetTransfers(
        [FromQuery] string? status,
        [FromQuery] int? employeeId,
        [FromQuery] int? departmentId,
        [FromQuery] string? batchCode)
    {
        var role = GetCurrentRole();
        var currentUserId = GetCurrentUserId();

        // RBAC access scoping
        if (role == "employee")
        {
            employeeId = currentUserId; // Employee can only see own requests
        }
        else if (role == "manager")
        {
            var deptStr = User.FindFirstValue("departmentId") ?? "0";
            int.TryParse(deptStr, out int managerDeptId);
            if (!employeeId.HasValue && !departmentId.HasValue)
            {
                departmentId = managerDeptId;
            }
        }
        // hr and admin see all transfers across company!

        var list = _trfRepo.GetAll(status, employeeId, departmentId, batchCode);
        return Ok(new ApiResponse<List<TransferDetailDto>> { Success = true, Data = list });
    }

    [HttpGet("{id}")]
    public ActionResult<ApiResponse<TransferDetailDto>> GetById(int id)
    {
        var trf = _trfRepo.GetDetailById(id);
        if (trf == null)
            return NotFound(new ApiResponse<TransferDetailDto> { Success = false, Message = "Không tìm thấy hồ sơ điều chuyển." });

        var role = GetCurrentRole();
        var currentUserId = GetCurrentUserId();

        if (role == "employee" && trf.EmployeeId != currentUserId && trf.InitiatorId != currentUserId)
            return Forbid();

        return Ok(new ApiResponse<TransferDetailDto> { Success = true, Data = trf });
    }

    [HttpPost]
    public ActionResult<ApiResponse<TransferDetailDto>> CreateTransfer([FromBody] CreateTransferRequestDto request)
    {
        try
        {
            var role = GetCurrentRole();
            var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? "user@enterprise.com";
            var currentUserId = GetCurrentUserId();

            var created = _transferService.CreateTransfer(request, currentUserId, role, email);
            return Ok(new ApiResponse<TransferDetailDto> { Success = true, Message = "Tạo hồ sơ điều chuyển thành công.", Data = created });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<TransferDetailDto> { Success = false, Message = ex.Message });
        }
    }

    [HttpPost("bulk")]
    [Authorize(Roles = "hr,admin")]
    public ActionResult<ApiResponse<List<TransferDetailDto>>> CreateBulk([FromBody] BulkTransferRequestDto request)
    {
        try
        {
            var role = GetCurrentRole();
            var email = User.FindFirstValue(ClaimTypes.Email) ?? "hr@enterprise.com";
            var currentUserId = GetCurrentUserId();

            var results = _transferService.CreateBulkTransfer(request, currentUserId, role, email);
            return Ok(new ApiResponse<List<TransferDetailDto>> { Success = true, Message = $"Đã tạo thành công điều chuyển hàng loạt cho {results.Count} nhân sự.", Data = results });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<List<TransferDetailDto>> { Success = false, Message = ex.Message });
        }
    }

    [HttpPost("{id}/decision")]
    public ActionResult<ApiResponse<TransferDetailDto>> ProcessDecision(int id, [FromBody] TransferDecisionDto decision)
    {
        try
        {
            var role = GetCurrentRole();
            var email = User.FindFirstValue(ClaimTypes.Email) ?? "user@enterprise.com";
            var currentUserId = GetCurrentUserId();

            var updated = _transferService.ProcessDecision(id, decision, currentUserId, role, email);
            return Ok(new ApiResponse<TransferDetailDto> { Success = true, Message = "Đã cập nhật quyết định phê duyệt.", Data = updated });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<TransferDetailDto> { Success = false, Message = ex.Message });
        }
    }

    [HttpPost("{id}/consent")]
    public ActionResult<ApiResponse<TransferDetailDto>> ProcessConsent(int id, [FromBody] TransferConsentDto consent)
    {
        try
        {
            var currentUserId = GetCurrentUserId();

            var updated = _transferService.ProcessConsent(id, consent, currentUserId);
            return Ok(new ApiResponse<TransferDetailDto> { Success = true, Message = "Đã ghi nhận phản hồi của bạn.", Data = updated });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<TransferDetailDto> { Success = false, Message = ex.Message });
        }
    }

    [HttpPut("{id}/resubmit")]
    public ActionResult<ApiResponse<TransferDetailDto>> Resubmit(int id, [FromBody] ResubmitTransferDto request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();

            var updated = _transferService.ResubmitTransfer(id, request, currentUserId);
            return Ok(new ApiResponse<TransferDetailDto> { Success = true, Message = "Đã gửi lại hồ sơ điều chuyển sau khi bổ sung.", Data = updated });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<TransferDetailDto> { Success = false, Message = ex.Message });
        }
    }

    [HttpPut("{id}/cancel")]
    public ActionResult<ApiResponse<TransferDetailDto>> Cancel(int id, [FromQuery] string? reason)
    {
        try
        {
            var role = GetCurrentRole();
            var currentUserId = GetCurrentUserId();

            var updated = _transferService.CancelTransfer(id, currentUserId, role, reason);
            return Ok(new ApiResponse<TransferDetailDto> { Success = true, Message = "Đã hủy hồ sơ điều chuyển.", Data = updated });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<TransferDetailDto> { Success = false, Message = ex.Message });
        }
    }

    [HttpPut("{id}/cancel-approved")]
    [Authorize(Roles = "hr,admin")]
    public ActionResult<ApiResponse<TransferDetailDto>> CancelApproved(int id, [FromQuery] string reason)
    {
        try
        {
            var role = GetCurrentRole();
            var currentUserId = GetCurrentUserId();

            var updated = _transferService.CancelApprovedTransfer(id, currentUserId, role, reason);
            return Ok(new ApiResponse<TransferDetailDto> { Success = true, Message = "Đã thu hồi quyết định điều chuyển.", Data = updated });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<TransferDetailDto> { Success = false, Message = ex.Message });
        }
    }

    [HttpPut("{id}/amend")]
    [Authorize(Roles = "hr,admin")]
    public ActionResult<ApiResponse<TransferDetailDto>> Amend(int id, [FromBody] AmendTransferDto request)
    {
        try
        {
            var role = GetCurrentRole();
            var currentUserId = GetCurrentUserId();

            var updated = _transferService.AmendTransfer(id, request, currentUserId, role);
            return Ok(new ApiResponse<TransferDetailDto> { Success = true, Message = "Đã cập nhật thông tin hồ sơ.", Data = updated });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<TransferDetailDto> { Success = false, Message = ex.Message });
        }
    }
}
