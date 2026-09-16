namespace Healthcare.DTOs.Doctor;

public record DoctorResponseDto(int DoctorId, string DoctorNumber, string FullName, string Specialization, string PhoneNumber, string Email, string DepartmentName);
