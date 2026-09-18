namespace Healthcare.DTOs.Doctor;

public class CreateDoctorDto
{
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
    public List<string> AvailableDays { get; set; } = new();
    public TimeSpan? AvailableTimeFrom { get; set; }
    public TimeSpan? AvailableTimeTo { get; set; }
    public short? MaxPatientsPerDay { get; set; }
    public DateTime? JoiningDate { get; set; }

    public string? Bio { get; set; }
    public List<string> LanguagesSpoken { get; set; } = new();
}

public class UpdateDoctorDto : CreateDoctorDto
{
    public string Status { get; set; } = "Active";
}

public class DoctorResponseDto
{
    public int DoctorId { get; set; }
    public string DoctorCode { get; set; } = "";
    public DateTime RegistrationDate { get; set; }
    public string? RegisteredBy { get; set; }
    public string Status { get; set; } = "";

    public string FirstName { get; set; } = "";
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = "";
    public string FullName => $"{FirstName} {LastName}".Trim();
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
    public string Country { get; set; } = "";

    public decimal? ConsultationFee { get; set; }
    public List<string> AvailableDays { get; set; } = new();
    public TimeSpan? AvailableTimeFrom { get; set; }
    public TimeSpan? AvailableTimeTo { get; set; }
    public short? MaxPatientsPerDay { get; set; }
    public DateTime? JoiningDate { get; set; }

    public string? Bio { get; set; }
    public List<string> LanguagesSpoken { get; set; } = new();

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>Lightweight row shape returned by sp_Doctor_Search / list views.</summary>
public class DoctorSearchResultDto
{
    public int DoctorId { get; set; }
    public string DoctorCode { get; set; } = "";
    public string FullName { get; set; } = "";
    public string Specialization { get; set; } = "";
    public string? Department { get; set; }
    public string MobileNumber { get; set; } = "";
    public string Status { get; set; } = "";
}

public class DoctorSearchRequestDto
{
    public string? Query { get; set; }
    public string? Specialization { get; set; }
    public string? Status { get; set; }
}