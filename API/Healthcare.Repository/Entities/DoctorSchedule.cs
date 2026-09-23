namespace Healthcare.Repository.Entities;

public class DoctorSchedule
{
    public int ScheduleId { get; set; }
    public int DoctorId { get; set; }
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }
    public TimeSpan TimeFrom { get; set; }
    public TimeSpan TimeTo { get; set; }
    public int SlotDurationMinutes { get; set; }

    /// <summary>Stored as a comma-separated list in the DB, e.g. "in-person,online".</summary>
    public string AppointmentTypes { get; set; } = string.Empty;

    public bool RepeatWeekly { get; set; }
    public string? Reason { get; set; }
    public string Status { get; set; } = "Active";
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}