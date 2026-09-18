using Healthcare.DTOs.Doctor;

namespace Healthcare.Service.Interfaces;

public interface IDoctorService
{
    Task<DoctorResponseDto?> GetByIdAsync(int doctorId);
    Task<IEnumerable<DoctorResponseDto>> GetAllAsync();
    Task<IEnumerable<DoctorSearchResultDto>> SearchAsync(DoctorSearchRequestDto request);
    Task<DoctorResponseDto> CreateAsync(CreateDoctorDto request, string? registeredBy);
    Task<DoctorResponseDto?> UpdateAsync(int doctorId, UpdateDoctorDto request);
    Task<bool> DeleteAsync(int doctorId);
}