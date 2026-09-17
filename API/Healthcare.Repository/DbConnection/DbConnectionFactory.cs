using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
namespace Healthcare.Repository.DbConnection;

public sealed class DbConnectionFactory
{
    private readonly string _connectionString;
    public DbConnectionFactory(IConfiguration configuration)
        => _connectionString = configuration.GetConnectionString("DefaultConnection")
           ?? throw new InvalidOperationException("DefaultConnection is not configured.");
    public IDbConnection CreateConnection() => new SqlConnection(_connectionString);
}
