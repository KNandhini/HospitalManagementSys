using Healthcare.Repository.Entities;

namespace Healthcare.Repository.Interfaces;

public interface IDoctorScheduleRepository
{
    Task<DoctorSchedule?> GetByIdAsync(int scheduleId);
    Task<IEnumerable<DoctorSchedule>> GetByDoctorAsync(int doctorId, DateTime? dateFrom, DateTime? dateTo);
    Task<DoctorSchedule> CreateAsync(DoctorSchedule schedule);
    Task<DoctorSchedule?> UpdateAsync(DoctorSchedule schedule);
    Task<bool> DeleteAsync(int scheduleId);
}