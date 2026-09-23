
using System.Diagnostics;
using Healthcare.DTOs.Patient;
using Healthcare.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Healthcare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PatientController : ControllerBase
{
    private const int NoSearchCriteriaSupplied = 50010;

    private readonly IPatientService _service;
    private readonly ILogger<PatientController> _logger;

    public PatientController(
        IPatientService service,
        ILogger<PatientController> logger)
    {
        _service = service;
        _logger = logger;
    }

    // ============================================================
    // GET ALL PATIENTS
    // ============================================================
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var sw = Stopwatch.StartNew();

        try
        {
            var patients = await _service.GetAllAsync();

            sw.Stop();

            return Ok(new
            {
                success = true,
                message = "Patients retrieved successfully.",
                data = patients,
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
        catch (SqlException ex)
        {
            sw.Stop();

            _logger.LogError(ex, "Error retrieving patients");

            return StatusCode(500, new
            {
                success = false,
                message = ex.Message,
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
        catch (Exception ex)
        {
            sw.Stop();

            _logger.LogError(ex, "Unexpected error retrieving patients");

            return StatusCode(500, new
            {
                success = false,
                message = "An unexpected error occurred.",
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
    }

    // ============================================================
    // GET PATIENT BY ID
    // ============================================================
    [HttpGet("{patientId:int}")]
    public async Task<IActionResult> GetById(int patientId)
    {
        var sw = Stopwatch.StartNew();

        try
        {
            var patient = await _service.GetByIdAsync(patientId);

            sw.Stop();

            if (patient == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Patient not found.",
                    executionTimeMs = sw.ElapsedMilliseconds
                });
            }

            return Ok(new
            {
                success = true,
                message = "Patient retrieved successfully.",
                data = patient,
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
        catch (SqlException ex)
        {
            sw.Stop();

            _logger.LogError(
                ex,
                "Error retrieving patient {PatientId}",
                patientId);

            return StatusCode(500, new
            {
                success = false,
                message = ex.Message,
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
        catch (Exception ex)
        {
            sw.Stop();

            _logger.LogError(
                ex,
                "Unexpected error retrieving patient {PatientId}",
                patientId);

            return StatusCode(500, new
            {
                success = false,
                message = "An unexpected error occurred.",
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] string? status)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation(
            "API Request: GET /api/patient/search?q={Query}&status={Status} — TraceId={TraceId}",
            q, status, HttpContext.TraceIdentifier);

        try
        {
            var patients = await _service.SearchAsync(
                new PatientSearchRequestDto { Query = q, Status = status });

            sw.Stop();
            return Ok(new
            {
                success = true,
                message = "Patient search completed successfully.",
                data = patients,
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
        catch (SqlException ex)
        {
            sw.Stop();
            _logger.LogError(ex, "Error searching patients");
            return StatusCode(500, new
            {
                success = false,
                message = "A database error occurred while searching patients.",
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
    }

    // ============================================================
    // CREATE PATIENT
    // ============================================================
    [HttpPost]
    // [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(CreatePatientDto request)
    {
        var sw = Stopwatch.StartNew();

        // Logged-in user only
        //var registeredBy = User.Identity?.Name;
        var registeredBy = "Admin";
        try
        {
            var created = await _service.CreateAsync(
                request,
                registeredBy);

            sw.Stop();

            return Ok(new
            {
                success = true,
                message = "Patient created successfully.",
                data = created,
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
        catch (SqlException ex)
        {
            sw.Stop();

            _logger.LogError(
                ex,
                "Error creating patient");

            return StatusCode(500, new
            {
                success = false,
                message = ex.Message,
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
        catch (Exception ex)
        {
            sw.Stop();

            _logger.LogError(
                ex,
                "Unexpected error creating patient");

            return StatusCode(500, new
            {
                success = false,
                message = "An unexpected error occurred.",
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
    }

    // ============================================================
    // UPDATE PATIENT
    // ============================================================
    [HttpPut("{patientId:int}")]
    // [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(
        int patientId,
        UpdatePatientDto request)
    {
        var sw = Stopwatch.StartNew();

        // Logged-in user only
        var modifiedBy = User.Identity?.Name;

        try
        {
            var updated = await _service.UpdateAsync(
                patientId,
                request
       );

            sw.Stop();

            if (updated == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Patient not found.",
                    executionTimeMs = sw.ElapsedMilliseconds
                });
            }

            return Ok(new
            {
                success = true,
                message = "Patient updated successfully.",
                data = updated,
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
        catch (SqlException ex)
        {
            sw.Stop();

            _logger.LogError(
                ex,
                "Error updating patient {PatientId}",
                patientId);

            return StatusCode(500, new
            {
                success = false,
                message = ex.Message,
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
        catch (Exception ex)
        {
            sw.Stop();

            _logger.LogError(
                ex,
                "Unexpected error updating patient {PatientId}",
                patientId);

            return StatusCode(500, new
            {
                success = false,
                message = "An unexpected error occurred.",
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
    }

    // ============================================================
    // DELETE PATIENT
    // ============================================================
    [HttpDelete("{patientId:int}")]
    // [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int patientId)
    {
        var sw = Stopwatch.StartNew();

        // Logged-in user only
        var modifiedBy = User.Identity?.Name;

        try
        {
            var deleted = await _service.DeleteAsync(
                patientId
               );

            sw.Stop();

            if (!deleted)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Patient not found.",
                    executionTimeMs = sw.ElapsedMilliseconds
                });
            }

            return Ok(new
            {
                success = true,
                message = "Patient deleted successfully.",
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
        catch (SqlException ex)
        {
            sw.Stop();

            _logger.LogError(
                ex,
                "Error deleting patient {PatientId}",
                patientId);

            return StatusCode(500, new
            {
                success = false,
                message = ex.Message,
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
        catch (Exception ex)
        {
            sw.Stop();

            _logger.LogError(
                ex,
                "Unexpected error deleting patient {PatientId}",
                patientId);

            return StatusCode(500, new
            {
                success = false,
                message = "An unexpected error occurred.",
                executionTimeMs = sw.ElapsedMilliseconds
            });
        }
    }
}

