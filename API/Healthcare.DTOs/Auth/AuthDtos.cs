namespace Healthcare.DTOs.Auth;

public record LoginRequestDto(string Email, string Password);
public record LoginResponseDto(string Token, int UserId, string FullName, string Role);
