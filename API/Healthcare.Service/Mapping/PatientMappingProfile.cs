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
            .ForMember(d => d.PatientCode, opt => opt.Ignore())
            .ForMember(d => d.RegistrationDate, opt => opt.Ignore())
            .ForMember(d => d.RegisteredBy, opt => opt.Ignore())
            .ForMember(d => d.CreatedDate, opt => opt.Ignore())
            .ForMember(d => d.CreatedBy, opt => opt.Ignore())
            .ForMember(d => d.ModifiedDate, opt => opt.Ignore())
            .ForMember(d => d.ModifiedBy, opt => opt.Ignore())
            .ForMember(d => d.Status, opt => opt.MapFrom(_ => "Active"));

        // ── Update: incoming DTO -> entity ──
        CreateMap<UpdatePatientDto, Patient>()
            .ForMember(d => d.PatientId, opt => opt.Ignore())
            .ForMember(d => d.PatientCode, opt => opt.Ignore())
            .ForMember(d => d.RegistrationDate, opt => opt.Ignore())
            .ForMember(d => d.RegisteredBy, opt => opt.Ignore())
            .ForMember(d => d.Status, opt => opt.Ignore())
            .ForMember(d => d.CreatedDate, opt => opt.Ignore())
            .ForMember(d => d.CreatedBy, opt => opt.Ignore())
            .ForMember(d => d.ModifiedDate, opt => opt.Ignore())
            .ForMember(d => d.ModifiedBy, opt => opt.Ignore());

        // ── Entity -> outgoing full response DTO ──
        CreateMap<Patient, PatientResponseDto>();
    }
}