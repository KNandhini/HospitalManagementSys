using Healthcare.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace Healthcare.API.Controllers;
[ApiController, Route("api/[controller]"), Authorize]
public class DoctorController : ControllerBase
{
    private readonly IDoctorService _service;
    public DoctorController(IDoctorService service) => _service = service;
    [HttpGet] public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());
}
