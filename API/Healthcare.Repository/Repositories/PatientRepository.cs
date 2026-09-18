using System.Data;
using Dapper;
using Healthcare.DTOs.Patient;
using Healthcare.Repository.Constants;
using Healthcare.Repository.DbConnection;
using Healthcare.Repository.Entities;
using Healthcare.Repository.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;

namespace Healthcare.Repository.Repositories;

public class PatientRepository : IPatientRepository
{
    /// <summary>sp_DeletePatient's custom error for "not found or already inactive".</summary>
    private const int PatientNotFoundOrInactive = 50023;

    /// <summary>sp_GetPatientDetails' custom error for "no filter criteria supplied".</summary>
    private const int NoSearchCriteriaSupplied = 50010;

    private readonly DbConnectionFactory _db;
    private readonly ILogger<PatientRepository> _logger;

    public PatientRepository(DbConnectionFactory db, ILogger<PatientRepository> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<Patient?> GetByIdAsync(int patientId)
    {
        try
        {
            using var c = _db.CreateConnection();
            return await c.QueryFirstOrDefaultAsync<Patient>(
                PatientStoredProcedures.GetById,
                new { PatientId = patientId },
                commandType: CommandType.StoredProcedure);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error in {Procedure} while fetching PatientId {PatientId}.",
                PatientStoredProcedures.GetById, patientId);
            throw;
        }
    }

    public async Task<IEnumerable<Patient>> GetAllAsync()
    {
        try
        {
            using var c = _db.CreateConnection();
            return await c.QueryAsync<Patient>(
                PatientStoredProcedures.GetAll,
                commandType: CommandType.StoredProcedure);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error in {Procedure} while fetching all patients.",
                PatientStoredProcedures.GetAll);
            throw;
        }
    }

    public async Task<IEnumerable<Patient>> SearchAsync(PatientSearchRequestDto request)
    {
        try
        {
            using var c = _db.CreateConnection();
            return await c.QueryAsync<Patient>(
                PatientStoredProcedures.Search,
                new
                {
                    request.PatientId,
                    request.FirstName,
                    request.LastName,
                    request.DateOfBirth,
                    request.MobileNumber
                },
                commandType: CommandType.StoredProcedure);
        }
        catch (SqlException ex) when (ex.Number == NoSearchCriteriaSupplied)
        {
            // Service-layer validation should catch this first; this is a backstop.
            _logger.LogWarning("{Procedure} called with no filter criteria.", PatientStoredProcedures.Search);
            throw;
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "SQL error in {Procedure} while searching patients. PatientId={PatientId}, FirstName={FirstName}, LastName={LastName}, DateOfBirth={DateOfBirth}, MobileNumber={MobileNumber}.",
                PatientStoredProcedures.Search, request.PatientId, request.FirstName, request.LastName,
                request.DateOfBirth, request.MobileNumber);
            throw;
        }
    }

    public async Task<(int PatientId, string PatientCode)> CreateAsync(CreatePatientDto dto, string registeredBy)
    {
        try
        {
            using var c = _db.CreateConnection();
            var result = await c.QueryFirstOrDefaultAsync<(int PatientId, string PatientCode)>(
                PatientStoredProcedures.Create,
                new
                {
                    RegisteredBy = registeredBy,
                    dto.ReferringDoctor,
                    dto.FirstName,
                    dto.MiddleName,
                    dto.LastName,
                    dto.DateOfBirth,
                    dto.Gender,
                    dto.MaritalStatus,
                    dto.BloodGroup,
                    dto.PreferredLanguage,
                    dto.NationalId,
                    dto.MobileNumber,
                    dto.AlternatePhone,
                    dto.Email,
                    dto.PreferredContactMethod,
                    dto.AddressLine1,
                    dto.AddressLine2,
                    dto.City,
                    dto.State,
                    dto.PostalCode,
                    dto.Country,
                    dto.EmergencyContactName,
                    dto.EmergencyRelationship,
                    dto.EmergencyPhone,
                    dto.InsuranceProvider,
                    dto.PolicyNumber,
                    dto.PolicyValidTill,
                    dto.PayerType,
                    dto.KnownAllergies,
                    dto.ChronicConditions,
                    dto.CurrentMedications,
                    dto.PhotoFileName,
                    dto.PhotoFilePath
                },
                commandType: CommandType.StoredProcedure);

            _logger.LogInformation("{Procedure} succeeded. New PatientId={PatientId}, PatientCode={PatientCode}",
                PatientStoredProcedures.Create, result.PatientId, result.PatientCode);

            return result;
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error in {Procedure} while creating patient {FirstName} {LastName}.",
                PatientStoredProcedures.Create, dto.FirstName, dto.LastName);
            throw;
        }
    }

    public async Task<int> UpdateAsync(int patientId, UpdatePatientDto dto, string actorUser)
    {
        try
        {
            using var c = _db.CreateConnection();
            var rowsAffected = await c.QueryFirstOrDefaultAsync<int>(
                PatientStoredProcedures.Update,
                new
                {
                    PatientId = patientId,
                    ActorUser = actorUser,
                    dto.ReferringDoctor,
                    dto.FirstName,
                    dto.MiddleName,
                    dto.LastName,
                    dto.DateOfBirth,
                    dto.Gender,
                    dto.MaritalStatus,
                    dto.BloodGroup,
                    dto.PreferredLanguage,
                    dto.MobileNumber,
                    dto.AlternatePhone,
                    dto.Email,
                    dto.PreferredContactMethod,
                    dto.AddressLine1,
                    dto.AddressLine2,
                    dto.City,
                    dto.State,
                    dto.PostalCode,
                    dto.Country,
                    dto.EmergencyContactName,
                    dto.EmergencyRelationship,
                    dto.EmergencyPhone,
                    dto.InsuranceProvider,
                    dto.PolicyNumber,
                    dto.PolicyValidTill,
                    dto.PayerType,
                    dto.KnownAllergies,
                    dto.ChronicConditions,
                    dto.CurrentMedications
                },
                commandType: CommandType.StoredProcedure);

            if (rowsAffected == 0)
                _logger.LogWarning("{Procedure} matched no active patient for PatientId={PatientId}.",
                    PatientStoredProcedures.Update, patientId);
            else
                _logger.LogInformation("{Procedure} succeeded for PatientId={PatientId}.",
                    PatientStoredProcedures.Update, patientId);

            return rowsAffected;
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error in {Procedure} while updating PatientId {PatientId}.",
                PatientStoredProcedures.Update, patientId);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int patientId, string actorUser)
    {
        try
        {
            using var c = _db.CreateConnection();
            await c.ExecuteScalarAsync<int>(
                PatientStoredProcedures.Delete,
                new { PatientId = patientId, ActorUser = actorUser },
                commandType: CommandType.StoredProcedure);

            _logger.LogInformation("{Procedure} succeeded — PatientId={PatientId} set to Inactive.",
                PatientStoredProcedures.Delete, patientId);
            return true;
        }
        catch (SqlException ex) when (ex.Number == PatientNotFoundOrInactive)
        {
            _logger.LogWarning("{Procedure} found no active patient for PatientId={PatientId}.",
                PatientStoredProcedures.Delete, patientId);
            return false;
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error in {Procedure} while deleting PatientId {PatientId}.",
                PatientStoredProcedures.Delete, patientId);
            throw;
        }
    }
}
