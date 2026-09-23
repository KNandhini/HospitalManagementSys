using Dapper;
using Healthcare.Repository.Constants;
using Healthcare.Repository.DbConnection;
using Healthcare.Repository.Entities;
using Healthcare.Repository.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using System.Data;

namespace Healthcare.Repository.Repositories;

public class DoctorScheduleRepository : IDoctorScheduleRepository
{
    private readonly DbConnectionFactory _db;
    private readonly ILogger<DoctorScheduleRepository> _logger;

    public DoctorScheduleRepository(DbConnectionFactory db, ILogger<DoctorScheduleRepository> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<DoctorSchedule?> GetByIdAsync(int scheduleId)
    {
        try
        {
            using var c = _db.CreateConnection();
            return await c.QueryFirstOrDefaultAsync<DoctorSchedule>(
                StoredProcedures.ScheduleGetById,
                new { ScheduleId = scheduleId },
                commandType: CommandType.StoredProcedure);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error in {Procedure} while fetching ScheduleId {ScheduleId}.",
                StoredProcedures.ScheduleGetById, scheduleId);
            throw;
        }
    }

    public async Task<IEnumerable<DoctorSchedule>> GetByDoctorAsync(int doctorId, DateTime? dateFrom, DateTime? dateTo)
    {
        try
        {
            using var c = _db.CreateConnection();
            return await c.QueryAsync<DoctorSchedule>(
                StoredProcedures.ScheduleGetByDoctor,
                new { DoctorId = doctorId, DateFrom = dateFrom, DateTo = dateTo },
                commandType: CommandType.StoredProcedure);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "SQL error in {Procedure} while fetching schedules for DoctorId {DoctorId}.",
                StoredProcedures.ScheduleGetByDoctor, doctorId);
            throw;
        }
    }

    public async Task<DoctorSchedule> CreateAsync(DoctorSchedule schedule)
    {
        try
        {
            using var c = _db.CreateConnection();
            var created = await c.QueryFirstOrDefaultAsync<DoctorSchedule>(
                StoredProcedures.ScheduleCreate,
                new
                {
                    schedule.DoctorId,
                    schedule.DateFrom,
                    schedule.DateTo,
                    schedule.TimeFrom,
                    schedule.TimeTo,
                    schedule.SlotDurationMinutes,
                    schedule.AppointmentTypes,
                    schedule.RepeatWeekly,
                    // Was missing entirely — sp_DoctorSchedule_Create used to
                    // always fall back to its own 'Active' default because
                    // this parameter was never sent.
                    schedule.Status,
                    schedule.Reason,
                    schedule.CreatedBy
                },
                commandType: CommandType.StoredProcedure);

            if (created is null)
            {
                _logger.LogError(
                    "{Procedure} completed without returning a row. DoctorId={DoctorId}",
                    StoredProcedures.ScheduleCreate, schedule.DoctorId);
                throw new InvalidOperationException("Doctor schedule create did not return the expected row.");
            }

            _logger.LogInformation(
                "{Procedure} succeeded. New ScheduleId={ScheduleId}, DoctorId={DoctorId}, Status={Status}",
                StoredProcedures.ScheduleCreate, created.ScheduleId, created.DoctorId, created.Status);

            return created;
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "SQL error in {Procedure} while creating schedule for DoctorId {DoctorId}.",
                StoredProcedures.ScheduleCreate, schedule.DoctorId);
            throw;
        }
    }

    public async Task<DoctorSchedule?> UpdateAsync(DoctorSchedule schedule)
    {
        try
        {
            using var c = _db.CreateConnection();
            var updated = await c.QueryFirstOrDefaultAsync<DoctorSchedule>(
                StoredProcedures.ScheduleUpdate,
                new
                {
                    schedule.ScheduleId,
                    schedule.DateFrom,
                    schedule.DateTo,
                    schedule.TimeFrom,
                    schedule.TimeTo,
                    schedule.SlotDurationMinutes,
                    schedule.AppointmentTypes,
                    schedule.RepeatWeekly,
                    // Was missing entirely — Status could never be changed
                    // by an update before this.
                    schedule.Status,
                    schedule.Reason
                },
                commandType: CommandType.StoredProcedure);

            if (updated is null)
            {
                _logger.LogWarning(
                    "{Procedure} returned no row for ScheduleId={ScheduleId} (not found or inactive).",
                    StoredProcedures.ScheduleUpdate, schedule.ScheduleId);
                return null;
            }

            _logger.LogInformation("{Procedure} succeeded for ScheduleId={ScheduleId}, Status={Status}.",
                StoredProcedures.ScheduleUpdate, schedule.ScheduleId, updated.Status);

            return updated;
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error in {Procedure} while updating ScheduleId {ScheduleId}.",
                StoredProcedures.ScheduleUpdate, schedule.ScheduleId);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int scheduleId)
    {
        try
        {
            using var c = _db.CreateConnection();
            var result = await c.QueryFirstOrDefaultAsync<(int ScheduleId, string Status, DateTime? UpdatedAt)?>(
                StoredProcedures.ScheduleDelete,
                new { ScheduleId = scheduleId },
                commandType: CommandType.StoredProcedure);

            var success = result is not null;
            if (success)
                _logger.LogInformation("{Procedure} succeeded — ScheduleId={ScheduleId} set to Inactive.",
                    StoredProcedures.ScheduleDelete, scheduleId);
            else
                _logger.LogWarning("{Procedure} found no row for ScheduleId={ScheduleId}.",
                    StoredProcedures.ScheduleDelete, scheduleId);

            return success;
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "SQL error in {Procedure} while deleting ScheduleId {ScheduleId}.",
                StoredProcedures.ScheduleDelete, scheduleId);
            throw;
        }
    }
}