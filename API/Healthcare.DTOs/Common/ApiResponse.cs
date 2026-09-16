namespace Healthcare.DTOs.Common;

public record ApiResponse<T>(bool Success, string Message, T? Data = default);
public record PagedResponse<T>(IReadOnlyList<T> Items, int PageNumber, int PageSize, int TotalCount);
