namespace Healthcare.DTOs.Patient;

public class CreatePatientDto
{
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
    public string Email { get; set; } = "";
    public string? BloodGroup { get; set; }
}

public class UpdatePatientDto : CreatePatientDto { }

public class PatientResponseDto
{
    public int PatientId { get; set; }
    public string PatientNumber { get; set; } = "";
    public string FullName { get; set; } = "";
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
    public string Email { get; set; } = "";
    public string? BloodGroup { get; set; }
}
