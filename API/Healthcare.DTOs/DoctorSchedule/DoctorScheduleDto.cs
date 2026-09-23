using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Healthcare.DTOs.DoctorSchedule
{
    public class DoctorScheduleDto
    {
        public int ScheduleId { get; set; }

        public int DoctorId { get; set; }

        public DateTime DateFrom { get; set; }

        public DateTime DateTo { get; set; }

        public TimeSpan TimeFrom { get; set; }

        public TimeSpan TimeTo { get; set; }

        public int SlotDurationMinutes { get; set; }

        /// <summary>e.g. ["in-person", "online"] — must contain at least one entry.</summary>
        public List<string> AppointmentTypes { get; set; } = new();

        public bool RepeatWeekly { get; set; }

        [MaxLength(500)]
        public string? Reason { get; set; }

        /// <summary>"Active" (available) or "OnLeave".</summary>
        public string Status { get; set; } = "Active";

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateDoctorScheduleDto
    {
        public int DoctorId { get; set; }

        public DateTime DateFrom { get; set; }

        public DateTime DateTo { get; set; }

        public TimeSpan TimeFrom { get; set; }

        public TimeSpan TimeTo { get; set; }

        public int SlotDurationMinutes { get; set; }

        public List<string> AppointmentTypes { get; set; } = new();

        public bool RepeatWeekly { get; set; }

        /// <summary>
        /// "Active" (available) or "OnLeave". Defaults to "Active" so
        /// existing callers that don't send it keep working unchanged.
        /// </summary>
        public string Status { get; set; } = "Active";

        [MaxLength(500)]
        public string? Reason { get; set; }
    }

    public class UpdateDoctorScheduleDto
    {
        public DateTime DateFrom { get; set; }

        public DateTime DateTo { get; set; }

        public TimeSpan TimeFrom { get; set; }

        public TimeSpan TimeTo { get; set; }

        public int SlotDurationMinutes { get; set; }

        public List<string> AppointmentTypes { get; set; } = new();

        public bool RepeatWeekly { get; set; }

        /// <summary>"Active" (available) or "OnLeave".</summary>
        public string Status { get; set; } = "Active";

        public string? Reason { get; set; }
    }

    public class DoctorScheduleResponseDto
    {
        public int ScheduleId { get; set; }
        public int DoctorId { get; set; }
        public DateTime DateFrom { get; set; }
        public DateTime DateTo { get; set; }
        public TimeSpan TimeFrom { get; set; }
        public TimeSpan TimeTo { get; set; }
        public int SlotDurationMinutes { get; set; }
        public List<string> AppointmentTypes { get; set; } = new();
        public bool RepeatWeekly { get; set; }
        public string? Reason { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}