using Healthcare.DTOs.Auth;
namespace Healthcare.Service.Interfaces;
public interface IAuthService { Task<LoginResponseDto?> LoginAsync(LoginRequestDto request); }
