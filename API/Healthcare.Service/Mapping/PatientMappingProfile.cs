using AutoMapper;
using Healthcare.DTOs.Patient;
using Healthcare.Repository.Entities;

namespace Healthcare.Service.Mapping;

public class PatientMappingProfile : Profile
{
    public PatientMappingProfile()
    {
        // ── Create: incoming DTO -> entity ──
        CreateMap<CreatePatientDto, Patient>()
            .ForMember(d => d.PatientId, opt => opt.Ignore())
            .ForMember(d => d.PatientNumber, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore())
            .ForMember(d => d.IsActive, opt => opt.MapFrom(_ => true));

        // ── Update: incoming DTO -> entity ──
        CreateMap<UpdatePatientDto, Patient>()
            .ForMember(d => d.PatientId, opt => opt.Ignore())
            .ForMember(d => d.PatientNumber, opt => opt.Ignore())
            .ForMember(d => d.CreatedAt, opt => opt.Ignore());

        // ── Entity -> outgoing full response DTO ──
        CreateMap<Patient, PatientResponseDto>();

        // ── Entity -> lightweight search result row ──
        CreateMap<Patient, PatientSearchResultDto>()
            .ForMember(d => d.FullName, opt => opt.MapFrom(s => $"{s.FirstName} {s.LastName}".Trim()));
    }
}
