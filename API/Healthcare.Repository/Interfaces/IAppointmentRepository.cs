using Healthcare.DTOs.Appointment;
namespace Healthcare.Repository.Interfaces;
public interface IAppointmentRepository
{
    Task<int> CreateAsync(CreateAppointmentDto request);
    Task<AppointmentResponseDto?> GetByIdAsync(int appointmentId);
    Task<IEnumerable<AppointmentResponseDto>> GetByPatientAsync(int patientId);
    Task<bool> CancelAsync(int appointmentId);
}
