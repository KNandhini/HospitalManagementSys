namespace Healthcare.Repository.Entities;

/// <summary>
/// Maps 1:1 to the columns returned by sp_GetPatientById / sp_GetAllPatients /
/// sp_GetPatientDetails. Dapper materializes stored-procedure result rows
/// directly into this POCO.
///
/// NOTE: NationalId is intentionally NOT a property here. It's stored as
/// VARBINARY(512) in tbl_Patients and accepted by sp_InsertPatient, but none
/// of the read procedures select it back out - so it's write-only from the
/// API's perspective and never appears in a response.
/// </summary>
public class Patient
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
