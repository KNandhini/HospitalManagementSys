using Healthcare.DTOs.Patient;
using Healthcare.Repository.Entities;
using Healthcare.Repository.Interfaces;
using Healthcare.Service.Interfaces;
using Microsoft.Extensions.Logging;

namespace Healthcare.Service.Services;

public class PatientService : IPatientService
{
    private readonly IPatientRepository _repo;
    private readonly ILogger<PatientService> _logger;

    public PatientService(IPatientRepository repo, ILogger<PatientService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<PatientResponseDto?> GetByIdAsync(int patientId)
    {
        var patient = await _repo.GetByIdAsync(patientId);
        return patient is null ? null : ToDto(patient);
    }

    public async Task<IEnumerable<PatientResponseDto>> GetAllAsync()
    {
        var patients = await _repo.GetAllAsync();
        return patients.Select(ToDto);
    }

    public async Task<IEnumerable<PatientResponseDto>> SearchAsync(PatientSearchRequestDto request)
    {
        if (request.PatientId is null && request.FirstName is null && request.LastName is null
            && request.DateOfBirth is null && request.MobileNumber is null)
        {
            throw new ArgumentException(
                "Provide at least one of: PatientId, FirstName/LastName, DateOfBirth, or MobileNumber.");
        }

        var patients = await _repo.SearchAsync(request);
        return patients.Select(ToDto);
    }

    public async Task<PatientResponseDto> CreateAsync(CreatePatientDto request, string registeredBy)
    {
        _logger.LogInformation(
            "PatientService.CreateAsync — starting create. Name={FirstName} {LastName}, RegisteredBy={RegisteredBy}",
            request.FirstName, request.LastName, registeredBy);

        var (patientId, patientCode) = await _repo.CreateAsync(request, registeredBy);

        _logger.LogInformation(
            "PatientService.CreateAsync — success. PatientId={PatientId}, PatientCode={PatientCode}",
            patientId, patientCode);

        // sp_InsertPatient only returns the new id/code, not the full row -
        // read it back so the response reflects exactly what's in the DB
        // (server-computed RegistrationDate, Status, CreatedDate, etc).
        var created = await _repo.GetByIdAsync(patientId);
        if (created is null)
        {
            // Should not happen - the insert just committed - but guard anyway.
            throw new InvalidOperationException(
                $"Patient {patientId} was created but could not be re-read immediately afterward.");
        }

        return ToDto(created);
    }

    public async Task<PatientResponseDto?> UpdateAsync(int patientId, UpdatePatientDto request, string actorUser)
    {
        _logger.LogInformation("PatientService.UpdateAsync — starting update. PatientId={PatientId}", patientId);

        var rowsAffected = await _repo.UpdateAsync(patientId, request, actorUser);
        if (rowsAffected == 0)
        {
            _logger.LogWarning("PatientService.UpdateAsync — PatientId={PatientId} not found or inactive", patientId);
            return null;
        }

        var updated = await _repo.GetByIdAsync(patientId);
        return updated is null ? null : ToDto(updated);
    }

    public Task<bool> DeleteAsync(int patientId, string actorUser)
    {
        _logger.LogInformation("PatientService.DeleteAsync — deactivating PatientId={PatientId}", patientId);
        return _repo.DeleteAsync(patientId, actorUser);
    }

    private static PatientResponseDto ToDto(Patient p) => new()
    {
        PatientId = p.PatientId,
        PatientCode = p.PatientCode,
        RegistrationDate = p.RegistrationDate,
        RegisteredBy = p.RegisteredBy,
        ReferringDoctor = p.ReferringDoctor,
        Status = p.Status,
        FirstName = p.FirstName,
        MiddleName = p.MiddleName,
        LastName = p.LastName,
        DateOfBirth = p.DateOfBirth,
        Gender = p.Gender,
        MaritalStatus = p.MaritalStatus,
        BloodGroup = p.BloodGroup,
        PreferredLanguage = p.PreferredLanguage,
        MobileNumber = p.MobileNumber,
        AlternatePhone = p.AlternatePhone,
        Email = p.Email,
        PreferredContactMethod = p.PreferredContactMethod,
        AddressLine1 = p.AddressLine1,
        AddressLine2 = p.AddressLine2,
        City = p.City,
        State = p.State,
        PostalCode = p.PostalCode,
        Country = p.Country,
        EmergencyContactName = p.EmergencyContactName,
        EmergencyRelationship = p.EmergencyRelationship,
        EmergencyPhone = p.EmergencyPhone,
        InsuranceProvider = p.InsuranceProvider,
        PolicyNumber = p.PolicyNumber,
        PolicyValidTill = p.PolicyValidTill,
        PayerType = p.PayerType,
        KnownAllergies = p.KnownAllergies,
        ChronicConditions = p.ChronicConditions,
        CurrentMedications = p.CurrentMedications,
        PhotoFileName = p.PhotoFileName,
        PhotoFilePath = p.PhotoFilePath,
        CreatedDate = p.CreatedDate,
        CreatedBy = p.CreatedBy,
        ModifiedDate = p.ModifiedDate,
        ModifiedBy = p.ModifiedBy
    };
}
