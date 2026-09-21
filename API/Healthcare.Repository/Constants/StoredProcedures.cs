namespace Healthcare.Repository.Constants;

/// <summary>
/// Central reference for every stored procedure used by the repositories.
/// Rename a procedure in SQL, update it once here, and every call site follows.
/// </summary>
public static class StoredProcedures
{
    // =========================
    // Doctor
    // =========================
    public const string GetById = "sp_Doctor_GetById";
    public const string GetAll = "sp_Doctor_GetAll";
    public const string Search = "sp_Doctor_Search";
    public const string Create = "sp_Doctor_Create";
    public const string Update = "sp_Doctor_Update";
    public const string Delete = "sp_Doctor_Delete";


    // =========================
    // Patient
    // =========================
    public const string PatientGetById = "sp_GetPatientById";
    public const string PatientGetAll = "sp_GetAllPatients";
    public const string PatientSearch = "sp_GetPatientDetails";
    public const string PatientCreate = "sp_InsertPatient";
    public const string PatientUpdate = "sp_UpdatePatient";
    public const string PatientDelete = "sp_DeletePatient";
}