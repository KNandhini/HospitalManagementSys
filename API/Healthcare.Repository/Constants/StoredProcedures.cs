namespace Healthcare.Repository.Constants;

/// <summary>
/// Central reference for every stored procedure DoctorRepository calls.
/// Rename a proc in SQL, update it once here, and every call site follows.
/// </summary>
public static class StoredProcedures
{
    public const string GetById = "sp_Doctor_GetById";
    public const string GetAll = "sp_Doctor_GetAll";
    public const string Search = "sp_Doctor_Search";
    public const string Create = "sp_Doctor_Create";
    public const string Update = "sp_Doctor_Update";
    public const string Delete = "sp_Doctor_Delete";
}