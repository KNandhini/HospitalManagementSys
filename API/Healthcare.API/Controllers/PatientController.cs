using Healthcare.DTOs.Patient;
using Healthcare.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Healthcare.API.Controllers;
[ApiController, Route("api/[controller]")]
[Authorize]
public class PatientController : ControllerBase
{
    private readonly IPatientService _service;
    public PatientController(IPatientService service) => _service = service;

    [HttpGet("{patientId:int}")]
    public async Task<IActionResult> Get(int patientId) => (await _service.GetByIdAsync(patientId)) is { } p ? Ok(p) : NotFound();

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpPost]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<IActionResult> Create(CreatePatientDto request)
    {
        var id = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(Get), new { patientId = id }, new { PatientId = id });
    }

    [HttpPut("{patientId:int}")]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<IActionResult> Update(int patientId, UpdatePatientDto request)
        => await _service.UpdateAsync(patientId, request) ? NoContent() : NotFound();

    [HttpDelete("{patientId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int patientId)
        => await _service.DeleteAsync(patientId) ? NoContent() : NotFound();
}
