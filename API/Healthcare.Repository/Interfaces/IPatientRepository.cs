using Healthcare.DTOs.Patient;
using Healthcare.Repository.Entities;

namespace Healthcare.Repository.Interfaces;

public interface IPatientRepository
{
    Task<Patient?> GetByIdAsync(int patientId);
    Task<IEnumerable<Patient>> GetAllAsync();
    Task<IEnumerable<Patient>> SearchAsync(PatientSearchRequestDto request);

    /// <summary>Returns the new PatientId and the PatientCode allocated for it.</summary>
    Task<(int PatientId, string PatientCode)> CreateAsync(CreatePatientDto dto, string registeredBy);

    /// <summary>Returns rows affected - 0 means no matching, active patient was found.</summary>
    Task<int> UpdateAsync(int patientId, UpdatePatientDto dto);

    /// <summary>
    /// Returns false if the patient didn't exist or was already inactive
    /// (sp_DeletePatient throws error 50023 for that case - this method
    /// catches it and translates it to a plain false rather than letting
    /// it surface as a generic SqlException).
    /// </summary>
    Task<bool> DeleteAsync(int patientId);
}
