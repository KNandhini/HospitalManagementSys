using Healthcare.DTOs.Appointment;
using Healthcare.Repository.Interfaces;
using Healthcare.Service.Interfaces;
namespace Healthcare.Service.Services;
public class AppointmentService : IAppointmentService
{
    private readonly IAppointmentRepository _repo;
    public AppointmentService(IAppointmentRepository repo) => _repo = repo;
    public Task<int> CreateAsync(CreateAppointmentDto request) => _repo.CreateAsync(request);
    public Task<AppointmentResponseDto?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<IEnumerable<AppointmentResponseDto>> GetByPatientAsync(int patientId) => _repo.GetByPatientAsync(patientId);
    public Task<bool> CancelAsync(int id) => _repo.CancelAsync(id);
}
