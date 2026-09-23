namespace Healthcare.Repository.Constants;

/// <summary>
/// Central reference for every stored procedure PatientRepository calls
/// against db_a85a40_healthcaresys. Rename a proc in SQL, update it once
/// here, and every call site follows.
/// </summary>
public static class PatientStoredProcedures
{
    public const string GetById = "sp_GetPatientById";
    public const string GetAll  = "sp_GetAllPatients";

    /// <summary>
    /// sp_GetPatientDetails is a flexible filter (by PatientId, Name,
    /// DateOfBirth, or MobileNumber), not a fixed "one patient's full
    /// details" lookup - despite the name. Exposed as Search here.
    /// </summary>
   // public const string Search = "sp_GetPatientDetails";

    public const string Create = "sp_InsertPatient";
    public const string Update = "sp_UpdatePatient";
    public const string Delete = "sp_DeletePatient";
    public const string Search = "sp_Patient_Search";
}
