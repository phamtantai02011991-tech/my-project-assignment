using EmployeeTransferApi.Dtos;
using EmployeeTransferApi.Entities;
using EmployeeTransferApi.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeTransferApi.Controllers;

[ApiController]
[Route("api")]
public class DepartmentsController : ControllerBase
{
    private readonly IEmployeeRepository _empRepo;

    public DepartmentsController(IEmployeeRepository empRepo)
    {
        _empRepo = empRepo;
    }

    [HttpGet("departments")]
    public ActionResult<ApiResponse<List<Department>>> GetDepartments()
    {
        var list = _empRepo.GetDepartments();
        return Ok(new ApiResponse<List<Department>> { Success = true, Data = list });
    }

    [HttpGet("positions")]
    public ActionResult<ApiResponse<List<Position>>> GetPositions()
    {
        var list = _empRepo.GetPositions();
        return Ok(new ApiResponse<List<Position>> { Success = true, Data = list });
    }
}
