using Healthcare.DTOs.Patient;
namespace Healthcare.Service.Interfaces;
public interface IPatientService
{
    Task<PatientResponseDto?> GetByIdAsync(int id);
    Task<IEnumerable<PatientResponseDto>> GetAllAsync();
    Task<int> CreateAsync(CreatePatientDto request);
    Task<bool> UpdateAsync(int id, UpdatePatientDto request);
    Task<bool> DeleteAsync(int id);
}
