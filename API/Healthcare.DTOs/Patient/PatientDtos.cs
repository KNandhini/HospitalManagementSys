namespace Healthcare.DTOs.Patient;

/// <summary>
/// Matches sp_InsertPatient's parameters, minus @RegisteredBy - that comes
/// from the authenticated caller (User.Identity.Name), not the request body.
/// </summary>
public class CreatePatientDto
{
    public string? ReferringDoctor { get; set; }

    public string FirstName { get; set; } = "";
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = "";
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = "";
    public string? MaritalStatus { get; set; }
    public string? BloodGroup { get; set; }
    public string? PreferredLanguage { get; set; }

    /// <summary>
    /// Stored as VARBINARY(512). Nothing in sp_InsertPatient encrypts or
    /// hashes this - if that needs to happen, it has to happen before this
    /// DTO is built (e.g. in the service layer), since the proc stores
    /// whatever bytes it's given as-is.
    /// </summary>
    public byte[]? NationalId { get; set; }

    public string MobileNumber { get; set; } = "";
    public string? AlternatePhone { get; set; }
    public string? Email { get; set; }
    public string? PreferredContactMethod { get; set; }

    public string AddressLine1 { get; set; } = "";
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = "";
    public string State { get; set; } = "";
    public string PostalCode { get; set; } = "";
    public string Country { get; set; } = "";

    public string EmergencyContactName { get; set; } = "";
    public string EmergencyRelationship { get; set; } = "";
    public string EmergencyPhone { get; set; } = "";

    public string? InsuranceProvider { get; set; }
    public string? PolicyNumber { get; set; }
    public DateTime? PolicyValidTill { get; set; }
    public string? PayerType { get; set; }

    public string? KnownAllergies { get; set; }
    public string? ChronicConditions { get; set; }
    public string? CurrentMedications { get; set; }

    public string? PhotoFileName { get; set; }
    public string? PhotoFilePath { get; set; }
}

/// <summary>
/// Matches sp_UpdatePatient's parameters, minus @PatientId (route value)
/// and @ActorUser (authenticated caller). Note what's NOT here versus
/// CreatePatientDto: no NationalId and no PhotoFileName/PhotoFilePath -
/// sp_UpdatePatient doesn't accept any of those three, so none of them
/// can be changed after registration through these procedures.
/// </summary>
public class UpdatePatientDto
{
    public string? ReferringDoctor { get; set; }

    public string FirstName { get; set; } = "";
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = "";
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = "";
    public string? MaritalStatus { get; set; }
    public string? BloodGroup { get; set; }
    public string? PreferredLanguage { get; set; }

    public string MobileNumber { get; set; } = "";
    public string? AlternatePhone { get; set; }
    public string? Email { get; set; }
    public string? PreferredContactMethod { get; set; }

    public string AddressLine1 { get; set; } = "";
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = "";
    public string State { get; set; } = "";
    public string PostalCode { get; set; } = "";
    public string Country { get; set; } = "";

    public string EmergencyContactName { get; set; } = "";
    public string EmergencyRelationship { get; set; } = "";
    public string EmergencyPhone { get; set; } = "";

    public string? InsuranceProvider { get; set; }
    public string? PolicyNumber { get; set; }
    public DateTime? PolicyValidTill { get; set; }
    public string? PayerType { get; set; }

    public string? KnownAllergies { get; set; }
    public string? ChronicConditions { get; set; }
    public string? CurrentMedications { get; set; }
    public string? Status { get; set; }
    public string? PhotoFileName { get; set; }
    public string? PhotoFilePath { get; set; }

}

/// <summary>
/// Matches the exact column list returned by sp_GetPatientById /
/// sp_GetAllPatients / sp_GetPatientDetails. NationalId is deliberately
/// absent - the database never returns it, so the API never can either.
/// </summary>
public class PatientResponseDto
{
    public int PatientId { get; set; }
    public string PatientCode { get; set; } = "";
    public DateTime RegistrationDate { get; set; }
    public string RegisteredBy { get; set; } = "";
    public string? ReferringDoctor { get; set; }
    public string Status { get; set; } = "";

    public string FirstName { get; set; } = "";
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = "";
    public string FullName =>
        string.Join(" ", new[] { FirstName, MiddleName, LastName }.Where(s => !string.IsNullOrWhiteSpace(s)));
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = "";
    public string? MaritalStatus { get; set; }
    public string? BloodGroup { get; set; }
    public string? PreferredLanguage { get; set; }

    public string MobileNumber { get; set; } = "";
    public string? AlternatePhone { get; set; }
    public string? Email { get; set; }
    public string? PreferredContactMethod { get; set; }

    public string AddressLine1 { get; set; } = "";
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = "";
    public string State { get; set; } = "";
    public string PostalCode { get; set; } = "";
    public string Country { get; set; } = "";

    public string EmergencyContactName { get; set; } = "";
    public string EmergencyRelationship { get; set; } = "";
    public string EmergencyPhone { get; set; } = "";

    public string? InsuranceProvider { get; set; }
    public string? PolicyNumber { get; set; }
    public DateTime? PolicyValidTill { get; set; }
    public string? PayerType { get; set; }

    public string? KnownAllergies { get; set; }
    public string? ChronicConditions { get; set; }
    public string? CurrentMedications { get; set; }

    public string? PhotoFileName { get; set; }
    public string? PhotoFilePath { get; set; }

    public DateTime CreatedDate { get; set; }
    public string CreatedBy { get; set; } = "";
    public DateTime? ModifiedDate { get; set; }
    public string? ModifiedBy { get; set; }
}

/// <summary>
/// Matches sp_GetPatientDetails' parameters exactly. The proc THROWs
/// (error 50010) if every field is null - PatientService validates that
/// up front so the API returns a clean 400 instead of a SQL error.
/// </summary>


public class PatientSearchRequestDto
{
    public string? Query { get; set; }
    public string? Status { get; set; }
}
