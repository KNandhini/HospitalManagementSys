using Healthcare.Repository.Entities;
using System.Numerics;

namespace Healthcare.Repository.Interfaces;

public interface IDoctorRepository
{
    Task<Doctor?> GetByIdAsync(int doctorId);
    Task<IEnumerable<Doctor>> GetAllAsync();
    Task<IEnumerable<Doctor>> SearchAsync(string? query, string? specialization, string? status);
    Task<Doctor> CreateAsync(Doctor doctor);
    Task<Doctor?> UpdateAsync(Doctor doctor);
    Task<bool> DeleteAsync(int doctorId);
}