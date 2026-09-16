using System.Data;
using Dapper;
using Healthcare.Repository.DbConnection;
using Healthcare.Repository.Interfaces;

namespace Healthcare.Repository.Repositories;
public class AuthRepository : IAuthRepository
{
    private readonly DbConnectionFactory _db;
    public AuthRepository(DbConnectionFactory db) => _db = db;
    public async Task<UserRecord?> GetUserByEmailAsync(string email)
    {
        using var c = _db.CreateConnection();
        return await c.QueryFirstOrDefaultAsync<UserRecord>("sp_User_GetByEmail",
            new { Email = email }, commandType: CommandType.StoredProcedure);
    }
}
