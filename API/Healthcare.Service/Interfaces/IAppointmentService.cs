using Healthcare.DTOs.Appointment;
namespace Healthcare.Service.Interfaces;
public interface IAppointmentService
{
    Task<int> CreateAsync(CreateAppointmentDto request);
    Task<AppointmentResponseDto?> GetByIdAsync(int id);
    Task<IEnumerable<AppointmentResponseDto>> GetByPatientAsync(int patientId);
    Task<bool> CancelAsync(int id);
}
