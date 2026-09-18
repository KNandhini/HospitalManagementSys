namespace Healthcare.Repository.Entities;

/// <summary>
/// Maps 1:1 to the columns returned by sp_Doctor_Create / sp_Doctor_Update /
/// sp_Doctor_GetById / sp_Doctor_Search / sp_Doctor_GetAll. Dapper
/// materializes stored-procedure result rows directly into this POCO.
/// </summary>
public class Doctor
{
    public int DoctorId { get; set; }
    public string DoctorCode { get; set; } = "";
    public DateTime RegistrationDate { get; set; }
    public string? RegisteredBy { get; set; }
    public string Status { get; set; } = "Active";

    public string FirstName { get; set; } = "";
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = "";
    public string Gender { get; set; } = "";
    public DateTime? DateOfBirth { get; set; }
    public string? PhotoUrl { get; set; }
    public string? NationalId { get; set; }

    public string Specialization { get; set; } = "";
    public string Qualification { get; set; } = "";
    public string MedicalLicenseNumber { get; set; } = "";
    public string? RegistrationCouncil { get; set; }
    public short? YearsOfExperience { get; set; }
    public string? Department { get; set; }
    public string? Designation { get; set; }

    public string MobileNumber { get; set; } = "";
    public string? AlternatePhone { get; set; }
    public string? Email { get; set; }
    public string? PreferredContactMethod { get; set; }

    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public string Country { get; set; } = "India";

    public decimal? ConsultationFee { get; set; }
    // Stored as comma-separated VARCHAR(50) in SQL (e.g. "Mon,Wed,Fri");
    // split/joined by the AutoMapper profile at the DTO boundary.
    public string? AvailableDays { get; set; }
    public TimeSpan? AvailableTimeFrom { get; set; }
    public TimeSpan? AvailableTimeTo { get; set; }
    public short? MaxPatientsPerDay { get; set; }
    public DateTime? JoiningDate { get; set; }

    public string? Bio { get; set; }
    // Stored as comma-separated VARCHAR(200) in SQL.
    public string? LanguagesSpoken { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}