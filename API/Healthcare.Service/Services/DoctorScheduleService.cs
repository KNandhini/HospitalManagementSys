using AutoMapper;
using Healthcare.DTOs.DoctorSchedule;
using Healthcare.Repository.Entities;
using Healthcare.Repository.Interfaces;
using Healthcare.Service.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;

namespace Healthcare.Service.Services;

public class DoctorScheduleService : IDoctorScheduleService
{
    private readonly IDoctorScheduleRepository _repo;
    private readonly IMapper _mapper;
    private readonly ILogger<DoctorScheduleService> _logger;

    public DoctorScheduleService(IDoctorScheduleRepository repo, IMapper mapper, ILogger<DoctorScheduleService> logger)
    {
        _repo = repo;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<DoctorScheduleResponseDto?> GetByIdAsync(int scheduleId)
    {
        _logger.LogInformation("DoctorScheduleService.GetByIdAsync — ScheduleId={ScheduleId}", scheduleId);
        var schedule = await _repo.GetByIdAsync(scheduleId);
        return schedule is null ? null : _mapper.Map<DoctorScheduleResponseDto>(schedule);
    }

    public async Task<IEnumerable<DoctorScheduleResponseDto>> GetByDoctorAsync(int doctorId, DateTime? dateFrom, DateTime? dateTo)
    {
        _logger.LogInformation(
            "DoctorScheduleService.GetByDoctorAsync — DoctorId={DoctorId}, DateFrom={DateFrom}, DateTo={DateTo}",
            doctorId, dateFrom, dateTo);

        var schedules = await _repo.GetByDoctorAsync(doctorId, dateFrom, dateTo);
        return _mapper.Map<IEnumerable<DoctorScheduleResponseDto>>(schedules);
    }

    public async Task<DoctorScheduleResponseDto> CreateAsync(CreateDoctorScheduleDto request, string? createdBy)
    {
        _logger.LogInformation(
            "DoctorScheduleService.CreateAsync — starting create. DoctorId={DoctorId}, CreatedBy={CreatedBy}",
            request.DoctorId, createdBy);

        var entity = _mapper.Map<DoctorSchedule>(request);
        entity.CreatedBy = createdBy;

        try
        {
            var created = await _repo.CreateAsync(entity);
            _logger.LogInformation(
                "DoctorScheduleService.CreateAsync — success. ScheduleId={ScheduleId}",
                created.ScheduleId);
            return _mapper.Map<DoctorScheduleResponseDto>(created);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex,
                "DoctorScheduleService.CreateAsync — failed to create schedule for DoctorId={DoctorId}",
                request.DoctorId);
            throw;
        }
    }

    public async Task<DoctorScheduleResponseDto?> UpdateAsync(int scheduleId, UpdateDoctorScheduleDto request)
    {
        _logger.LogInformation("DoctorScheduleService.UpdateAsync — starting update. ScheduleId={ScheduleId}", scheduleId);

        var entity = _mapper.Map<DoctorSchedule>(request);
        entity.ScheduleId = scheduleId;

        try
        {
            var updated = await _repo.UpdateAsync(entity);
            if (updated is null)
            {
                _logger.LogWarning("DoctorScheduleService.UpdateAsync — ScheduleId={ScheduleId} not found, no update applied", scheduleId);
                return null;
            }

            _logger.LogInformation("DoctorScheduleService.UpdateAsync — success. ScheduleId={ScheduleId}", scheduleId);
            return _mapper.Map<DoctorScheduleResponseDto>(updated);
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "DoctorScheduleService.UpdateAsync — failed to update ScheduleId={ScheduleId}", scheduleId);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int scheduleId)
    {
        _logger.LogInformation("DoctorScheduleService.DeleteAsync — deactivating ScheduleId={ScheduleId}", scheduleId);

        try
        {
            var success = await _repo.DeleteAsync(scheduleId);
            if (!success)
                _logger.LogWarning("DoctorScheduleService.DeleteAsync — ScheduleId={ScheduleId} not found", scheduleId);

            return success;
        }
        catch (SqlException ex)
        {
            _logger.LogError(ex, "DoctorScheduleService.DeleteAsync — failed to deactivate ScheduleId={ScheduleId}", scheduleId);
            throw;
        }
    }
}