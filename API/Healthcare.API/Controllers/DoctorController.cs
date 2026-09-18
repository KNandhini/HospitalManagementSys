using System.Diagnostics;
using Healthcare.DTOs.Doctor;
using Healthcare.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Healthcare.API.Controllers;

[ApiController, Route("api/[controller]"),]
public class DoctorController : ControllerBase
{
    private readonly IDoctorService _service;
    private readonly ILogger<DoctorController> _logger;

    public DoctorController(IDoctorService service, ILogger<DoctorController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var sw = Stopwatch.StartNew();
       _logger.LogInformation("API Request: GET /api/doctor — TraceId={TraceId}", HttpContext.TraceIdentifier);
        try
        {
            var result = await _service.GetAllAsync();
            _logger.LogInformation(
                "API Response: GET /api/doctor — 200 OK, Count={Count}, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                result.Count(), sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return Ok(result);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: GET /api/doctor — database error, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while retrieving doctors." });
        }
    }

    [HttpGet("{doctorId:int}")]
    public async Task<IActionResult> GetById(int doctorId)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation(
            "API Request: GET /api/doctor/{DoctorId} — TraceId={TraceId}", doctorId, HttpContext.TraceIdentifier);
        try
        {
            var result = await _service.GetByIdAsync(doctorId);
            if (result is null)
            {
                _logger.LogWarning(
                    "API Error: GET /api/doctor/{DoctorId} — 404 Not Found, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                    doctorId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
                return NotFound(new { success = false, message = $"Doctor {doctorId} was not found." });
            }

            _logger.LogInformation(
                "API Response: GET /api/doctor/{DoctorId} — 200 OK, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                doctorId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return Ok(result);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: GET /api/doctor/{DoctorId} — database error, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                doctorId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while retrieving the doctor." });
        }
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] string? specialization, [FromQuery] string? status)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation(
            "API Request: GET /api/doctor/search?q={Query}&specialization={Specialization}&status={Status} — TraceId={TraceId}",
            q, specialization, status, HttpContext.TraceIdentifier);
        try
        {
            var result = await _service.SearchAsync(new DoctorSearchRequestDto { Query = q, Specialization = specialization, Status = status });
            _logger.LogInformation(
                "API Response: GET /api/doctor/search — 200 OK, Count={Count}, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                result.Count(), sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return Ok(result);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: GET /api/doctor/search — database error, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while searching doctors." });
        }
    }

    [HttpPost]
   // [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(CreateDoctorDto request)
    {
        var sw = Stopwatch.StartNew();
        var registeredBy = User.Identity?.Name;
        _logger.LogInformation(
            "API Request: POST /api/doctor — Name={FirstName} {LastName}, License={License}, RegisteredBy={RegisteredBy}, TraceId={TraceId}",
            request.FirstName, request.LastName, request.MedicalLicenseNumber, registeredBy, HttpContext.TraceIdentifier);

        try
        {
            var created = await _service.CreateAsync(request, registeredBy);
            _logger.LogInformation(
                "API Response: POST /api/doctor — 201 Created, DoctorId={DoctorId}, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                created.DoctorId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return CreatedAtAction(nameof(GetById), new { doctorId = created.DoctorId }, created);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: POST /api/doctor — database error while creating doctor. License={License}, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                request.MedicalLicenseNumber, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while creating the doctor. Please verify the license number is unique." });
        }
    }

    [HttpPut("{doctorId:int}")]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int doctorId, UpdateDoctorDto request)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation(
            "API Request: PUT /api/doctor/{DoctorId} — TraceId={TraceId}", doctorId, HttpContext.TraceIdentifier);

        try
        {
            var updated = await _service.UpdateAsync(doctorId, request);
            if (updated is null)
            {
                _logger.LogWarning(
                    "API Error: PUT /api/doctor/{DoctorId} — 404 Not Found, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                    doctorId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
                return NotFound(new { success = false, message = $"Doctor {doctorId} was not found." });
            }

            _logger.LogInformation(
                "API Response: PUT /api/doctor/{DoctorId} — 200 OK, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                doctorId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return Ok(updated);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: PUT /api/doctor/{DoctorId} — database error, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                doctorId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while updating the doctor." });
        }
    }

    [HttpDelete("{doctorId:int}")]
    //[Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int doctorId)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation(
            "API Request: DELETE /api/doctor/{DoctorId} — TraceId={TraceId}", doctorId, HttpContext.TraceIdentifier);

        try
        {
            var success = await _service.DeleteAsync(doctorId);
            if (!success)
            {
                _logger.LogWarning(
                    "API Error: DELETE /api/doctor/{DoctorId} — 404 Not Found, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                    doctorId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
                return NotFound(new { success = false, message = $"Doctor {doctorId} was not found." });
            }

            _logger.LogInformation(
                "API Response: DELETE /api/doctor/{DoctorId} — 204 No Content, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                doctorId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return NoContent();
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: DELETE /api/doctor/{DoctorId} — database error, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                doctorId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while deactivating the doctor." });
        }
    }
}