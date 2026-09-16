using Healthcare.DTOs.Auth;
using Healthcare.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;
namespace Healthcare.API.Controllers;
[ApiController, Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _service;
    public AuthController(IAuthService service) => _service = service;
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto request)
    {
        var result = await _service.LoginAsync(request);
        return result is null ? Unauthorized(new { Message = "Invalid email or password." }) : Ok(result);
    }
}
