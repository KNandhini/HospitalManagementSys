# HealthcareSolution

A production-style ASP.NET Core Web API starter using .NET 10, SQL Server, Dapper, stored procedures, layered architecture, JWT authentication, Serilog, Swagger/OpenAPI, FluentValidation, and global exception handling.

## Projects
- Healthcare.API - HTTP/API layer
- Healthcare.Service - business logic
- Healthcare.Repository - Dapper/SQL Server data access
- Healthcare.DTOs - request/response contracts
- Healthcare.Tests - unit-test starter

## Prerequisites
- .NET 10 SDK
- SQL Server
- Visual Studio 2022/2026 or VS Code

## Run
1. Execute `Healthcare.Database/01_CreateDatabase.sql` in SQL Server.
2. Update the connection string and JWT settings in `Healthcare.API/appsettings.Development.json`.
3. Restore/build:
   `dotnet restore`
   `dotnet build`
4. Run:
   `dotnet run --project Healthcare.API`
5. Open Swagger at `/swagger`.

Default demo credentials after running the database script:
- admin@example.com / Admin@123
- doctor@example.com / Doctor@123
- patient@example.com / Patient@123

Change demo passwords before any real deployment.

## API
- POST `/api/auth/login`
- GET `/api/patients/{patientId}`
- GET `/api/patients`
- POST `/api/patients`
- PUT `/api/patients/{patientId}`
- DELETE `/api/patients/{patientId}`
- GET `/api/doctors`
- POST `/api/appointments`
- GET `/api/appointments/{appointmentId}`
- GET `/api/appointments/patient/{patientId}`
- POST `/api/appointments/{appointmentId}/cancel`

This is a starter/reference implementation, not a compliance-certified healthcare system. For production use, add your organization's security, privacy, retention, audit, consent, encryption, secrets management, and regulatory controls.
