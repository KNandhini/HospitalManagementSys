using Healthcare.DTOs.Patient;
using Healthcare.Repository.Interfaces;
using Healthcare.Service.Interfaces;
namespace Healthcare.Service.Services;
public class PatientService : IPatientService
{
    private readonly IPatientRepository _repo;
    private readonly ILogger<PatientService> _logger;
    public PatientService(IPatientRepository repo, ILogger<PatientService> logger) { _repo = repo; _logger = logger; }
    public Task<PatientResponseDto?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<IEnumerable<PatientResponseDto>> GetAllAsync() => _repo.GetAllAsync();
    public Task<int> CreateAsync(CreatePatientDto request) => _repo.CreateAsync(request);
    public Task<bool> UpdateAsync(int id, UpdatePatientDto request) => _repo.UpdateAsync(id, request);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
