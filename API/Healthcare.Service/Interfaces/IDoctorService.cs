using Healthcare.DTOs.Doctor;
namespace Healthcare.Service.Interfaces;
public interface IDoctorService { Task<IEnumerable<DoctorResponseDto>> GetAllAsync(); }
