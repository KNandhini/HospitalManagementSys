using System.Diagnostics;
using Healthcare.DTOs.DoctorSchedule;
using Healthcare.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Healthcare.API.Controllers;

[ApiController, Route("api/[controller]")]
public class DoctorScheduleController : ControllerBase
{
    private readonly IDoctorScheduleService _service;
    private readonly ILogger<DoctorScheduleController> _logger;

    public DoctorScheduleController(IDoctorScheduleService service, ILogger<DoctorScheduleController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("{scheduleId:int}")]
    public async Task<IActionResult> GetById(int scheduleId)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation(
            "API Request: GET /api/doctorschedule/{ScheduleId} — TraceId={TraceId}", scheduleId, HttpContext.TraceIdentifier);
        try
        {
            var result = await _service.GetByIdAsync(scheduleId);
            if (result is null)
            {
                _logger.LogWarning(
                    "API Error: GET /api/doctorschedule/{ScheduleId} — 404 Not Found, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                    scheduleId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
                return NotFound(new { success = false, message = $"Schedule {scheduleId} was not found." });
            }

            _logger.LogInformation(
                "API Response: GET /api/doctorschedule/{ScheduleId} — 200 OK, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                scheduleId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return Ok(result);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: GET /api/doctorschedule/{ScheduleId} — database error, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                scheduleId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while retrieving the schedule." });
        }
    }

    [HttpGet("doctor/{doctorId:int}")]
    public async Task<IActionResult> GetByDoctor(int doctorId, [FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation(
            "API Request: GET /api/doctorschedule/doctor/{DoctorId}?dateFrom={DateFrom}&dateTo={DateTo} — TraceId={TraceId}",
            doctorId, dateFrom, dateTo, HttpContext.TraceIdentifier);
        try
        {
            var result = await _service.GetByDoctorAsync(doctorId, dateFrom, dateTo);
            _logger.LogInformation(
                "API Response: GET /api/doctorschedule/doctor/{DoctorId} — 200 OK, Count={Count}, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                doctorId, result.Count(), sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return Ok(result);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: GET /api/doctorschedule/doctor/{DoctorId} — database error, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                doctorId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while retrieving schedules." });
        }
    }

    [HttpPost]
    // [Authorize(Roles = "Admin,Doctor")]
    public async Task<IActionResult> Create(CreateDoctorScheduleDto request)
    {
        var sw = Stopwatch.StartNew();
        var createdBy = User.Identity?.Name;
        _logger.LogInformation(
            "API Request: POST /api/doctorschedule — DoctorId={DoctorId}, CreatedBy={CreatedBy}, TraceId={TraceId}",
            request.DoctorId, createdBy, HttpContext.TraceIdentifier);

        try
        {
            var created = await _service.CreateAsync(request, createdBy);
            _logger.LogInformation(
                "API Response: POST /api/doctorschedule — 201 Created, ScheduleId={ScheduleId}, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                created.ScheduleId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return CreatedAtAction(nameof(GetById), new { scheduleId = created.ScheduleId }, created);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: POST /api/doctorschedule — database error while creating schedule. DoctorId={DoctorId}, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                request.DoctorId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while creating the schedule." });
        }
    }

    [HttpPut("{scheduleId:int}")]
    // [Authorize(Roles = "Admin,Doctor")]
    public async Task<IActionResult> Update(int scheduleId, UpdateDoctorScheduleDto request)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation(
            "API Request: PUT /api/doctorschedule/{ScheduleId} — TraceId={TraceId}", scheduleId, HttpContext.TraceIdentifier);

        try
        {
            var updated = await _service.UpdateAsync(scheduleId, request);
            if (updated is null)
            {
                _logger.LogWarning(
                    "API Error: PUT /api/doctorschedule/{ScheduleId} — 404 Not Found, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                    scheduleId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
                return NotFound(new { success = false, message = $"Schedule {scheduleId} was not found." });
            }

            _logger.LogInformation(
                "API Response: PUT /api/doctorschedule/{ScheduleId} — 200 OK, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                scheduleId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return Ok(updated);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: PUT /api/doctorschedule/{ScheduleId} — database error, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                scheduleId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while updating the schedule." });
        }
    }

    [HttpDelete("{scheduleId:int}")]
    // [Authorize(Roles = "Admin,Doctor")]
    public async Task<IActionResult> Delete(int scheduleId)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation(
            "API Request: DELETE /api/doctorschedule/{ScheduleId} — TraceId={TraceId}", scheduleId, HttpContext.TraceIdentifier);

        try
        {
            var success = await _service.DeleteAsync(scheduleId);
            if (!success)
            {
                _logger.LogWarning(
                    "API Error: DELETE /api/doctorschedule/{ScheduleId} — 404 Not Found, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                    scheduleId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
                return NotFound(new { success = false, message = $"Schedule {scheduleId} was not found." });
            }

            _logger.LogInformation(
                "API Response: DELETE /api/doctorschedule/{ScheduleId} — 204 No Content, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                scheduleId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return NoContent();
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: DELETE /api/doctorschedule/{ScheduleId} — database error, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                scheduleId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while deactivating the schedule." });
        }
    }
}