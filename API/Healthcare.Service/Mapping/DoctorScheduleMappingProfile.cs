using AutoMapper;
using Healthcare.DTOs.DoctorSchedule;
using Healthcare.Repository.Entities;

namespace Healthcare.Service.Mapping;

public class DoctorScheduleMappingProfile : Profile
{
    public DoctorScheduleMappingProfile()
    {
        // List<string> -> "in-person,online"
        CreateMap<CreateDoctorScheduleDto, DoctorSchedule>()
            .ForMember(d => d.AppointmentTypes,
                opt => opt.MapFrom(s => string.Join(",", s.AppointmentTypes)));

        CreateMap<UpdateDoctorScheduleDto, DoctorSchedule>()
            .ForMember(d => d.AppointmentTypes,
                opt => opt.MapFrom(s => string.Join(",", s.AppointmentTypes)));

        // "in-person,online" -> List<string>
        CreateMap<DoctorSchedule, DoctorScheduleResponseDto>()
            .ForMember(d => d.AppointmentTypes,
                opt => opt.MapFrom(s => s.AppointmentTypes
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .ToList()));
    }
}