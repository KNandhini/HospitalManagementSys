using Healthcare.Service.Interfaces;
using Healthcare.Service.Services;
using Microsoft.Extensions.DependencyInjection;
namespace Healthcare.Service;
public static class DependencyInjection
{
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddScoped<IPatientService, PatientService>();
        services.AddScoped<IDoctorService, DoctorService>();
        services.AddScoped<IAppointmentService, AppointmentService>();
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}
