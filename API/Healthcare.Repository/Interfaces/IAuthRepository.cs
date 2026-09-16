namespace Healthcare.Repository.Interfaces;
public record UserRecord(int UserId, string FullName, string Email, string PasswordHash, string Role);
public interface IAuthRepository { Task<UserRecord?> GetUserByEmailAsync(string email); }
