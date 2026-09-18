using Dapper;
using Healthcare.Repository.Constants;
using Healthcare.Repository.DbConnection;
using Healthcare.Repository.Entities;
using Healthcare.Repository.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using System.Data;
using System.Numerics;

namespace Healthcare.Repository.Repositories;

public class DoctorRepository : IDoctorRepository
{
    private readonly DbConnectionFactory _db;
    private readonly ILogger<DoctorRepository> _logger;

    public DoctorRepository(DbConnectionFactory db, ILogger<DoctorRepository> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<Doctor?> GetByIdAsync(int doctorId)
    {
        try
        {
            using var c = _db.CreateConnection();
            return await c.QueryFirstOrDefaultAsync<Doctor>(
                StoredProcedures.GetById,
                new { DoctorId = doctorId },
                commandType: CommandType.StoredProcedure);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error in {Procedure} while fetching DoctorId {DoctorId}.",
                StoredProcedures.GetById, doctorId);
            throw;
        }
    }

    public async Task<IEnumerable<Doctor>> GetAllAsync()
    {
        try
        {
            using var c = _db.CreateConnection();
            return await c.QueryAsync<Doctor>(
                StoredProcedures.GetById,          // same merged procedure now
                new { DoctorId = (int?)null },      // NULL → SP returns all doctors
                commandType: CommandType.StoredProcedure);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error in {Procedure} while fetching all doctors.",
                StoredProcedures.GetById);
            throw;
        }
    }

    public async Task<IEnumerable<Doctor>> SearchAsync(string? query, string? specialization, string? status)
    {
        try
        {
            using var c = _db.CreateConnection();
            return await c.QueryAsync<Doctor>(
                StoredProcedures.Search,
                new { Query = query, Specialization = specialization, Status = status },
                commandType: CommandType.StoredProcedure);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "SQL error in {Procedure} while searching doctors. Query={Query}, Specialization={Specialization}, Status={Status}.",
                StoredProcedures.Search, query, specialization, status);
            throw;
        }
    }

    public async Task<Doctor> CreateAsync(Doctor doctor)
    {
        try
        {
            using var c = _db.CreateConnection();
            var created = await c.QueryFirstOrDefaultAsync<Doctor>(
                StoredProcedures.Create,
                new
                {
                    doctor.FirstName,
                    doctor.MiddleName,
                    doctor.LastName,
                    doctor.Gender,
                    doctor.DateOfBirth,
                    doctor.PhotoUrl,
                    doctor.NationalId,
                    doctor.Specialization,
                    doctor.Qualification,
                    doctor.MedicalLicenseNumber,
                    doctor.RegistrationCouncil,
                    doctor.YearsOfExperience,
                    doctor.Department,
                    doctor.Designation,
                    doctor.MobileNumber,
                    doctor.AlternatePhone,
                    doctor.Email,
                    doctor.PreferredContactMethod,
                    doctor.AddressLine1,
                    doctor.AddressLine2,
                    doctor.City,
                    doctor.State,
                    doctor.PostalCode,
                    doctor.Country,
                    doctor.ConsultationFee,
                    doctor.AvailableDays,
                    doctor.AvailableTimeFrom,
                    doctor.AvailableTimeTo,
                    doctor.MaxPatientsPerDay,
                    doctor.JoiningDate,
                    doctor.Bio,
                    doctor.LanguagesSpoken,
                    doctor.RegisteredBy
                },
                commandType: CommandType.StoredProcedure);

            if (created is null)
            {
                // sp_Doctor_Create rolls back and RAISERROR's on failure, so this
                // branch is a defensive guard in case a row genuinely wasn't returned.
                _logger.LogError("{Procedure} completed without returning a row. License={License}",
                    StoredProcedures.Create, doctor.MedicalLicenseNumber);
                throw new InvalidOperationException("Doctor create did not return the expected row.");
            }

            _logger.LogInformation("{Procedure} succeeded. New DoctorId={DoctorId}, DoctorCode={DoctorCode}",
                StoredProcedures.Create, created.DoctorId, created.DoctorCode);

            return created;
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error in {Procedure} while creating doctor {FirstName} {LastName}, License={License}.",
                StoredProcedures.Create, doctor.FirstName, doctor.LastName, doctor.MedicalLicenseNumber);
            throw;
        }
    }

    public async Task<Doctor?> UpdateAsync(Doctor doctor)
    {
        try
        {
            using var c = _db.CreateConnection();
            var updated = await c.QueryFirstOrDefaultAsync<Doctor>(
                StoredProcedures.Update,
                new
                {
                    doctor.DoctorId,
                    doctor.FirstName,
                    doctor.MiddleName,
                    doctor.LastName,
                    doctor.Gender,
                    doctor.DateOfBirth,
                    doctor.PhotoUrl,
                    doctor.NationalId,
                    doctor.Specialization,
                    doctor.Qualification,
                    doctor.MedicalLicenseNumber,
                    doctor.RegistrationCouncil,
                    doctor.YearsOfExperience,
                    doctor.Department,
                    doctor.Designation,
                    doctor.MobileNumber,
                    doctor.AlternatePhone,
                    doctor.Email,
                    doctor.PreferredContactMethod,
                    doctor.AddressLine1,
                    doctor.AddressLine2,
                    doctor.City,
                    doctor.State,
                    doctor.PostalCode,
                    doctor.Country,
                    doctor.ConsultationFee,
                    doctor.AvailableDays,
                    doctor.AvailableTimeFrom,
                    doctor.AvailableTimeTo,
                    doctor.MaxPatientsPerDay,
                    doctor.JoiningDate,
                    doctor.Bio,
                    doctor.LanguagesSpoken,
                    doctor.Status
                },
                commandType: CommandType.StoredProcedure);

            if (updated is null)
            {
                _logger.LogWarning("{Procedure} returned no row for DoctorId={DoctorId} (not found or rolled back).",
                    StoredProcedures.Update, doctor.DoctorId);
                return null;
            }

            _logger.LogInformation("{Procedure} succeeded for DoctorId={DoctorId}.",
                StoredProcedures.Update, doctor.DoctorId);

            return updated;
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error in {Procedure} while updating DoctorId {DoctorId}.",
                StoredProcedures.Update, doctor.DoctorId);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int doctorId)
    {
        try
        {
            using var c = _db.CreateConnection();
            var result = await c.QueryFirstOrDefaultAsync<(int DoctorId, string Status, DateTime? UpdatedAt)?>(
                StoredProcedures.Delete,
                new { DoctorId = doctorId },
                commandType: CommandType.StoredProcedure);

            var success = result is not null;
            if (success)
                _logger.LogInformation("{Procedure} succeeded — DoctorId={DoctorId} set to Inactive.",
                    StoredProcedures.Delete, doctorId);
            else
                _logger.LogWarning("{Procedure} found no row for DoctorId={DoctorId}.",
                    StoredProcedures.Delete, doctorId);

            return success;
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error in {Procedure} while deleting DoctorId {DoctorId}.",
                StoredProcedures.Delete, doctorId);
            throw;
        }
    }
}