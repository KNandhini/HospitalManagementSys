using System.Data;
using Dapper;
using Healthcare.DTOs.Appointment;
using Healthcare.Repository.DbConnection;
using Healthcare.Repository.Interfaces;

namespace Healthcare.Repository.Repositories;

public class AppointmentRepository : IAppointmentRepository
{
    private readonly DbConnectionFactory _db;
    public AppointmentRepository(DbConnectionFactory db) => _db = db;

    public async Task<int> CreateAsync(CreateAppointmentDto request)
    {
        using var c = _db.CreateConnection();
        return await c.ExecuteScalarAsync<int>("sp_Appointment_Create", new
        {
            request.PatientId, request.DoctorId, request.AppointmentDate, request.Reason
        }, commandType: CommandType.StoredProcedure);
    }

    public async Task<AppointmentResponseDto?> GetByIdAsync(int appointmentId)
    {
        using var c = _db.CreateConnection();
        return await c.QueryFirstOrDefaultAsync<AppointmentResponseDto>("sp_Appointment_GetById",
            new { AppointmentId = appointmentId }, commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<AppointmentResponseDto>> GetByPatientAsync(int patientId)
    {
        using var c = _db.CreateConnection();
        return await c.QueryAsync<AppointmentResponseDto>("sp_Appointment_GetByPatient",
            new { PatientId = patientId }, commandType: CommandType.StoredProcedure);
    }

    public async Task<bool> CancelAsync(int appointmentId)
    {
        using var c = _db.CreateConnection();
        return await c.ExecuteAsync("sp_Appointment_Cancel", new { AppointmentId = appointmentId },
            commandType: CommandType.StoredProcedure) > 0;
    }
}
