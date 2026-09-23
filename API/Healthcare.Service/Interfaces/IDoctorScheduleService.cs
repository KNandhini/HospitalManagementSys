using Healthcare.DTOs.DoctorSchedule;

namespace Healthcare.Service.Interfaces;

public interface IDoctorScheduleService
{
    Task<DoctorScheduleResponseDto?> GetByIdAsync(int scheduleId);
    Task<IEnumerable<DoctorScheduleResponseDto>> GetByDoctorAsync(int doctorId, DateTime? dateFrom, DateTime? dateTo);
    Task<DoctorScheduleResponseDto> CreateAsync(CreateDoctorScheduleDto request, string? createdBy);
    Task<DoctorScheduleResponseDto?> UpdateAsync(int scheduleId, UpdateDoctorScheduleDto request);
    Task<bool> DeleteAsync(int scheduleId);
}