using AutoMapper;
using Healthcare.DTOs.Doctor;
using Healthcare.Repository.Entities;
using Healthcare.Repository.Interfaces;
using Healthcare.Service.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using System.Numerics;

namespace Healthcare.Service.Services;

public class DoctorService : IDoctorService
{
    private readonly IDoctorRepository _repo;
    private readonly IMapper _mapper;
    private readonly ILogger<DoctorService> _logger;

    public DoctorService(IDoctorRepository repo, IMapper mapper, ILogger<DoctorService> logger)
    {
        _repo = repo;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<DoctorResponseDto?> GetByIdAsync(int doctorId)
    {
        _logger.LogInformation("DoctorService.GetByIdAsync — DoctorId={DoctorId}", doctorId);
        var doctor = await _repo.GetByIdAsync(doctorId);
        return doctor is null ? null : _mapper.Map<DoctorResponseDto>(doctor);
    }

    public async Task<IEnumerable<DoctorResponseDto>> GetAllAsync()
    {
        _logger.LogInformation("DoctorService.GetAllAsync — fetching all doctors");
        var doctors = await _repo.GetAllAsync();
        return _mapper.Map<IEnumerable<DoctorResponseDto>>(doctors);
    }

    public async Task<IEnumerable<DoctorSearchResultDto>> SearchAsync(DoctorSearchRequestDto request)
    {
        _logger.LogInformation(
            "DoctorService.SearchAsync — Query={Query}, Specialization={Specialization}, Status={Status}",
            request.Query, request.Specialization, request.Status);

        var results = await _repo.SearchAsync(request.Query, request.Specialization, request.Status);
        return _mapper.Map<IEnumerable<DoctorSearchResultDto>>(results);
    }

    public async Task<DoctorResponseDto> CreateAsync(CreateDoctorDto request, string? registeredBy)
    {
        _logger.LogInformation(
            "DoctorService.CreateAsync — starting create. Name={FirstName} {LastName}, License={License}, RegisteredBy={RegisteredBy}",
            request.FirstName, request.LastName, request.MedicalLicenseNumber, registeredBy);

        var entity = _mapper.Map<Doctor>(request);
        entity.RegisteredBy = registeredBy;

        try
        {
            var created = await _repo.CreateAsync(entity);
            _logger.LogInformation(
                "DoctorService.CreateAsync — success. DoctorId={DoctorId}, DoctorCode={DoctorCode}",
                created.DoctorId, created.DoctorCode);
            return _mapper.Map<DoctorResponseDto>(created);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "DoctorService.CreateAsync — failed to create doctor. Name={FirstName} {LastName}, License={License}",
                request.FirstName, request.LastName, request.MedicalLicenseNumber);
            throw;
        }
    }

    public async Task<DoctorResponseDto?> UpdateAsync(int doctorId, UpdateDoctorDto request)
    {
        _logger.LogInformation("DoctorService.UpdateAsync — starting update. DoctorId={DoctorId}", doctorId);

        var entity = _mapper.Map<Doctor>(request);
        entity.DoctorId = doctorId;

        try
        {
            var updated = await _repo.UpdateAsync(entity);
            if (updated is null)
            {
                _logger.LogWarning("DoctorService.UpdateAsync — DoctorId={DoctorId} not found, no update applied", doctorId);
                return null;
            }

            _logger.LogInformation("DoctorService.UpdateAsync — success. DoctorId={DoctorId}", doctorId);
            return _mapper.Map<DoctorResponseDto>(updated);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "DoctorService.UpdateAsync — failed to update DoctorId={DoctorId}", doctorId);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int doctorId)
    {
        _logger.LogInformation("DoctorService.DeleteAsync — deactivating DoctorId={DoctorId}", doctorId);

        try
        {
            var success = await _repo.DeleteAsync(doctorId);
            if (!success)
                _logger.LogWarning("DoctorService.DeleteAsync — DoctorId={DoctorId} not found", doctorId);

            return success;
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "DoctorService.DeleteAsync — failed to deactivate DoctorId={DoctorId}", doctorId);
            throw;
        }
    }
}