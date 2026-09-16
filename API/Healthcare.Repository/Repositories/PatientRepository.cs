using System.Data;
using Dapper;
using Healthcare.DTOs.Patient;
using Healthcare.Repository.DbConnection;
using Healthcare.Repository.Interfaces;

namespace Healthcare.Repository.Repositories;

public class PatientRepository : IPatientRepository
{
    private readonly DbConnectionFactory _db;
    public PatientRepository(DbConnectionFactory db) => _db = db;

    public async Task<PatientResponseDto?> GetByIdAsync(int patientId)
    {
        using var c = _db.CreateConnection();
        return await c.QueryFirstOrDefaultAsync<PatientResponseDto>("sp_Patient_GetById",
            new { PatientId = patientId }, commandType: CommandType.StoredProcedure);
    }

    public async Task<IEnumerable<PatientResponseDto>> GetAllAsync()
    {
        using var c = _db.CreateConnection();
        return await c.QueryAsync<PatientResponseDto>("sp_Patient_GetAll", commandType: CommandType.StoredProcedure);
    }

    public async Task<int> CreateAsync(CreatePatientDto request)
    {
        using var c = _db.CreateConnection();
        return await c.ExecuteScalarAsync<int>("sp_Patient_Create", new
        {
            request.FirstName, request.LastName, request.DateOfBirth, request.Gender,
            request.PhoneNumber, request.Email, request.BloodGroup
        }, commandType: CommandType.StoredProcedure);
    }

    public async Task<bool> UpdateAsync(int patientId, UpdatePatientDto request)
    {
        using var c = _db.CreateConnection();
        return await c.ExecuteAsync("sp_Patient_Update", new
        {
            PatientId = patientId, request.FirstName, request.LastName, request.DateOfBirth,
            request.Gender, request.PhoneNumber, request.Email, request.BloodGroup
        }, commandType: CommandType.StoredProcedure) > 0;
    }

    public async Task<bool> DeleteAsync(int patientId)
    {
        using var c = _db.CreateConnection();
        return await c.ExecuteAsync("sp_Patient_Delete", new { PatientId = patientId },
            commandType: CommandType.StoredProcedure) > 0;
    }
}
