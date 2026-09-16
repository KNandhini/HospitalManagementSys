using System.Data;
using Dapper;
using Healthcare.DTOs.Doctor;
using Healthcare.Repository.DbConnection;
using Healthcare.Repository.Interfaces;

namespace Healthcare.Repository.Repositories;
public class DoctorRepository : IDoctorRepository
{
    private readonly DbConnectionFactory _db;
    public DoctorRepository(DbConnectionFactory db) => _db = db;
    public async Task<IEnumerable<DoctorResponseDto>> GetAllAsync()
    {
        using var c = _db.CreateConnection();
        return await c.QueryAsync<DoctorResponseDto>("sp_Doctor_GetAll", commandType: CommandType.StoredProcedure);
    }
}
