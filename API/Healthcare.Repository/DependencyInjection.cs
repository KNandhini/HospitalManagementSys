using Healthcare.Repository.DbConnection;
using Healthcare.Repository.Interfaces;
using Healthcare.Repository.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace Healthcare.Repository;
public static class DependencyInjection
{
    public static IServiceCollection AddRepository(this IServiceCollection services)
    {
        services.AddScoped<DbConnectionFactory>();
        services.AddScoped<IPatientRepository, PatientRepository>();
        services.AddScoped<IDoctorRepository, DoctorRepository>();
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddScoped<IAuthRepository, AuthRepository>();
        return services;
    }
}
