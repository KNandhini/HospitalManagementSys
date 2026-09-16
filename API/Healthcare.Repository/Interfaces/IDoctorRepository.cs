using Healthcare.DTOs.Doctor;
namespace Healthcare.Repository.Interfaces;
public interface IDoctorRepository { Task<IEnumerable<DoctorResponseDto>> GetAllAsync(); }
