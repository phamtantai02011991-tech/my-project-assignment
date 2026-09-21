using System.Security.Claims;
using EmployeeTransferApi.Dtos;
using EmployeeTransferApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeTransferApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public ActionResult<ApiResponse<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new ApiResponse<AuthResponseDto> { Success = false, Message = "Email và mật khẩu không được để trống." });

        var res = _authService.Login(request);
        if (res == null)
            return Unauthorized(new ApiResponse<AuthResponseDto> { Success = false, Message = "Email hoặc mật khẩu không chính xác." });

        return Ok(new ApiResponse<AuthResponseDto> { Success = true, Message = "Đăng nhập thành công.", Data = res });
    }

    [HttpPost("register")]
    public ActionResult<ApiResponse<AuthResponseDto>> Register([FromBody] RegisterRequestDto request)
    {
        try
        {
            var res = _authService.Register(request);
            return Ok(new ApiResponse<AuthResponseDto> { Success = true, Message = "Đăng ký tài khoản thành công.", Data = res });
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<AuthResponseDto> { Success = false, Message = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("me")]
    public ActionResult<ApiResponse<UserProfileDto>> GetCurrentUser()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? User.FindFirstValue("employeeId");
        if (int.TryParse(sub, out int empId))
        {
            var profile = _authService.GetProfileById(empId);
            if (profile != null)
                return Ok(new ApiResponse<UserProfileDto> { Success = true, Data = profile });
        }
        return Unauthorized(new ApiResponse<UserProfileDto> { Success = false, Message = "Phiên làm việc không hợp lệ." });
    }
}
