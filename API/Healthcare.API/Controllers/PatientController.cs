using System.Diagnostics;
using Healthcare.DTOs.Patient;
using Healthcare.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Healthcare.API.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public class PatientController : ControllerBase
{
    /// <summary>sp_GetPatientDetails' custom error for "no filter criteria supplied".</summary>
    private const int NoSearchCriteriaSupplied = 50010;

    private readonly IPatientService _service;
    private readonly ILogger<PatientController> _logger;

    public PatientController(IPatientService service, ILogger<PatientController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// sp_InsertPatient/sp_UpdatePatient/sp_DeletePatient all require a
    /// non-empty actor identity and THROW if it's missing - so this is
    /// checked here, before ever calling the service, rather than letting
    /// a null identity turn into a raw SQL error.
    /// </summary>
    private bool TryGetActorUser(out string actorUser, out IActionResult? error)
    {
        var name = User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(name))
        {
            actorUser = "";
            error = Unauthorized(new { success = false, message = "Authenticated user identity is required." });
            return false;
        }

        actorUser = name;
        error = null;
        return true;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation("API Request: GET /api/patient — TraceId={TraceId}", HttpContext.TraceIdentifier);
        try
        {
            var result = await _service.GetAllAsync();
            _logger.LogInformation(
                "API Response: GET /api/patient — 200 OK, Count={Count}, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                result.Count(), sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return Ok(result);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: GET /api/patient — database error, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while retrieving patients." });
        }
    }

    [HttpGet("{patientId:int}")]
    public async Task<IActionResult> GetById(int patientId)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation(
            "API Request: GET /api/patient/{PatientId} — TraceId={TraceId}", patientId, HttpContext.TraceIdentifier);
        try
        {
            var result = await _service.GetByIdAsync(patientId);
            if (result is null)
            {
                _logger.LogWarning(
                    "API Error: GET /api/patient/{PatientId} — 404 Not Found, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                    patientId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
                return NotFound(new { success = false, message = $"Patient {patientId} was not found." });
            }

            _logger.LogInformation(
                "API Response: GET /api/patient/{PatientId} — 200 OK, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                patientId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return Ok(result);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: GET /api/patient/{PatientId} — database error, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                patientId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while retrieving the patient." });
        }
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] int? patientId,
        [FromQuery] string? firstName,
        [FromQuery] string? lastName,
        [FromQuery] DateTime? dateOfBirth,
        [FromQuery] string? mobileNumber)
    {
        var sw = Stopwatch.StartNew();
        var request = new PatientSearchRequestDto
        {
            PatientId = patientId,
            FirstName = firstName,
            LastName = lastName,
            DateOfBirth = dateOfBirth,
            MobileNumber = mobileNumber
        };

        _logger.LogInformation(
            "API Request: GET /api/patient/search — TraceId={TraceId}", HttpContext.TraceIdentifier);
        try
        {
            var result = await _service.SearchAsync(request);
            _logger.LogInformation(
                "API Response: GET /api/patient/search — 200 OK, Count={Count}, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                result.Count(), sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (SqlException ex) when (ex.Number == NoSearchCriteriaSupplied)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: GET /api/patient/search — database error, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while searching patients." });
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<IActionResult> Create(CreatePatientDto request)
    {
        if (!TryGetActorUser(out var registeredBy, out var authError))
            return authError!;

        var sw = Stopwatch.StartNew();
        _logger.LogInformation(
            "API Request: POST /api/patient — Name={FirstName} {LastName}, RegisteredBy={RegisteredBy}, TraceId={TraceId}",
            request.FirstName, request.LastName, registeredBy, HttpContext.TraceIdentifier);

        try
        {
            var created = await _service.CreateAsync(request, registeredBy);
            _logger.LogInformation(
                "API Response: POST /api/patient — 201 Created, PatientId={PatientId}, PatientCode={PatientCode}, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                created.PatientId, created.PatientCode, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return CreatedAtAction(nameof(GetById), new { patientId = created.PatientId }, created);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: POST /api/patient — database error while creating patient. Name={FirstName} {LastName}, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                request.FirstName, request.LastName, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while creating the patient." });
        }
    }

    [HttpPut("{patientId:int}")]
    [Authorize(Roles = "Admin,Doctor")]
    public async Task<IActionResult> Update(int patientId, UpdatePatientDto request)
    {
        if (!TryGetActorUser(out var actorUser, out var authError))
            return authError!;

        var sw = Stopwatch.StartNew();
        _logger.LogInformation(
            "API Request: PUT /api/patient/{PatientId} — ActorUser={ActorUser}, TraceId={TraceId}",
            patientId, actorUser, HttpContext.TraceIdentifier);

        try
        {
            var updated = await _service.UpdateAsync(patientId, request, actorUser);
            if (updated is null)
            {
                _logger.LogWarning(
                    "API Error: PUT /api/patient/{PatientId} — 404 Not Found, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                    patientId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
                return NotFound(new { success = false, message = $"Patient {patientId} was not found or is inactive." });
            }

            _logger.LogInformation(
                "API Response: PUT /api/patient/{PatientId} — 200 OK, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                patientId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return Ok(updated);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: PUT /api/patient/{PatientId} — database error, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                patientId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while updating the patient." });
        }
    }

    [HttpDelete("{patientId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int patientId)
    {
        if (!TryGetActorUser(out var actorUser, out var authError))
            return authError!;

        var sw = Stopwatch.StartNew();
        _logger.LogInformation(
            "API Request: DELETE /api/patient/{PatientId} — ActorUser={ActorUser}, TraceId={TraceId}",
            patientId, actorUser, HttpContext.TraceIdentifier);

        try
        {
            var deleted = await _service.DeleteAsync(patientId, actorUser);
            if (!deleted)
            {
                _logger.LogWarning(
                    "API Error: DELETE /api/patient/{PatientId} — 404 Not Found, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                    patientId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
                return NotFound(new { success = false, message = $"Patient {patientId} was not found or is already inactive." });
            }

            _logger.LogInformation(
                "API Response: DELETE /api/patient/{PatientId} — 204 No Content, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                patientId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return NoContent();
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "API Error: DELETE /api/patient/{PatientId} — database error, ElapsedMs={ElapsedMs}, TraceId={TraceId}",
                patientId, sw.ElapsedMilliseconds, HttpContext.TraceIdentifier);
            return StatusCode(500, new { success = false, message = "A database error occurred while deactivating the patient." });
        }
    }
}
