namespace Healthcare.DTOs.Appointment;

public class CreateAppointmentDto
{
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string? Reason { get; set; }
}

public class AppointmentResponseDto
{
    public int AppointmentId { get; set; }
    public string AppointmentNumber { get; set; } = "";
    public int PatientId { get; set; }
    public string PatientName { get; set; } = "";
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = "";
    public DateTime AppointmentDate { get; set; }
    public string Status { get; set; } = "";
    public string? Reason { get; set; }
}
