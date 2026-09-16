using Healthcare.DTOs.Doctor;
using Healthcare.Repository.Interfaces;
using Healthcare.Service.Interfaces;
namespace Healthcare.Service.Services;
public class DoctorService : IDoctorService
{
    private readonly IDoctorRepository _repo;
    public DoctorService(IDoctorRepository repo) => _repo = repo;
    public Task<IEnumerable<DoctorResponseDto>> GetAllAsync() => _repo.GetAllAsync();
}
