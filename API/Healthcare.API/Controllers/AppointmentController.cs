using Healthcare.DTOs.Appointment;
using Healthcare.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace Healthcare.API.Controllers;
[ApiController, Route("api/[controller]"), Authorize]
public class AppointmentController : ControllerBase
{
    private readonly IAppointmentService _service;
    public AppointmentController(IAppointmentService service) => _service = service;

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id) => (await _service.GetByIdAsync(id)) is { } a ? Ok(a) : NotFound();

    [HttpGet("patient/{patientId:int}")]
    public async Task<IActionResult> ByPatient(int patientId) => Ok(await _service.GetByPatientAsync(patientId));

    [HttpPost]
    public async Task<IActionResult> Create(CreateAppointmentDto request)
    {
        var id = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(Get), new { id }, new { AppointmentId = id });
    }

    [HttpPost("{id:int}/cancel")]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<IActionResult> Cancel(int id) => await _service.CancelAsync(id) ? NoContent() : NotFound();
}
