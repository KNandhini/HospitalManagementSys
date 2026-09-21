using Healthcare.DTOs.Patient;

namespace Healthcare.Service.Interfaces;

public interface IPatientService
{
    Task<PatientResponseDto?> GetByIdAsync(int patientId);
    Task<IEnumerable<PatientResponseDto>> GetAllAsync();

    /// <summary>Throws ArgumentException if every field on the request is null.</summary>
    Task<IEnumerable<PatientResponseDto>> SearchAsync(PatientSearchRequestDto request);

    Task<PatientResponseDto> CreateAsync(CreatePatientDto request, string registeredBy);
    Task<PatientResponseDto?> UpdateAsync(int patientId, UpdatePatientDto request);
    Task<bool> DeleteAsync(int patientId);
}
