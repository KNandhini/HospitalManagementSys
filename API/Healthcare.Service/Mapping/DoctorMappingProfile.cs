using AutoMapper;
using Healthcare.DTOs.Doctor;
using Healthcare.Repository.Entities;

namespace Healthcare.Service.Mapping;

public class DoctorMappingProfile : Profile
{
    public DoctorMappingProfile()
    {
        // ── Create: incoming DTO -> entity ──
        CreateMap<CreateDoctorDto, Doctor>()
            .ForMember(d => d.AvailableDays, opt => opt.MapFrom(s => string.Join(",", s.AvailableDays)))
            .ForMember(d => d.LanguagesSpoken, opt => opt.MapFrom(s => string.Join(",", s.LanguagesSpoken)))
            .ForMember(d => d.DoctorId, opt => opt.Ignore())
            .ForMember(d => d.DoctorCode, opt => opt.Ignore())
            .ForMember(d => d.RegistrationDate, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore())
            .ForMember(d => d.Status, opt => opt.MapFrom(_ => "Active"));

        // ── Update: incoming DTO -> entity ──
        CreateMap<UpdateDoctorDto, Doctor>()
            .ForMember(d => d.AvailableDays, opt => opt.MapFrom(s => string.Join(",", s.AvailableDays)))
            .ForMember(d => d.LanguagesSpoken, opt => opt.MapFrom(s => string.Join(",", s.LanguagesSpoken)))
            .ForMember(d => d.DoctorId, opt => opt.Ignore())
            .ForMember(d => d.DoctorCode, opt => opt.Ignore())
            .ForMember(d => d.RegistrationDate, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.UpdatedAt, opt => opt.Ignore());

        // ── Entity -> outgoing full response DTO ──
        CreateMap<Doctor, DoctorResponseDto>()
            .ForMember(d => d.AvailableDays, opt => opt.MapFrom(s =>
                string.IsNullOrWhiteSpace(s.AvailableDays)
                    ? new List<string>()
                    : s.AvailableDays.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()))
            .ForMember(d => d.LanguagesSpoken, opt => opt.MapFrom(s =>
                string.IsNullOrWhiteSpace(s.LanguagesSpoken)
                    ? new List<string>()
                    : s.LanguagesSpoken.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()));

        // ── Entity -> lightweight search result row ──
        CreateMap<Doctor, DoctorSearchResultDto>()
            .ForMember(d => d.FullName, opt => opt.MapFrom(s => $"{s.FirstName} {s.LastName}".Trim()));
    }
}