using Healthcare.DTOs.Patient;
namespace Healthcare.Repository.Interfaces;
public interface IPatientRepository
{
    Task<PatientResponseDto?> GetByIdAsync(int patientId);
    Task<IEnumerable<PatientResponseDto>> GetAllAsync();
    Task<int> CreateAsync(CreatePatientDto request);
    Task<bool> UpdateAsync(int patientId, UpdatePatientDto request);
    Task<bool> DeleteAsync(int patientId);
}
