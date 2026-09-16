IF DB_ID('HealthcareDB') IS NULL CREATE DATABASE HealthcareDB;
GO
USE HealthcareDB;
GO

IF OBJECT_ID('dbo.Users','U') IS NULL
CREATE TABLE dbo.Users(
    UserId INT IDENTITY PRIMARY KEY,
    FullName NVARCHAR(150) NOT NULL,
    Email NVARCHAR(200) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(500) NOT NULL,
    Role NVARCHAR(30) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID('dbo.Departments','U') IS NULL
CREATE TABLE dbo.Departments(
    DepartmentId INT IDENTITY PRIMARY KEY,
    DepartmentName NVARCHAR(100) NOT NULL UNIQUE
);
GO

IF OBJECT_ID('dbo.Doctors','U') IS NULL
CREATE TABLE dbo.Doctors(
    DoctorId INT IDENTITY PRIMARY KEY,
    DoctorNumber AS ('DOC' + RIGHT('000000' + CAST(DoctorId AS VARCHAR(6)),6)) PERSISTED,
    FullName NVARCHAR(150) NOT NULL,
    Specialization NVARCHAR(150) NOT NULL,
    PhoneNumber NVARCHAR(30) NULL,
    Email NVARCHAR(200) NULL,
    DepartmentId INT NULL REFERENCES dbo.Departments(DepartmentId),
    IsActive BIT NOT NULL DEFAULT 1
);
GO

IF OBJECT_ID('dbo.Patients','U') IS NULL
CREATE TABLE dbo.Patients(
    PatientId INT IDENTITY PRIMARY KEY,
    PatientNumber AS ('PAT' + RIGHT('000000' + CAST(PatientId AS VARCHAR(6)),6)) PERSISTED,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Gender NVARCHAR(20) NOT NULL,
    PhoneNumber NVARCHAR(30) NOT NULL,
    Email NVARCHAR(200) NULL,
    BloodGroup NVARCHAR(10) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF OBJECT_ID('dbo.Appointments','U') IS NULL
CREATE TABLE dbo.Appointments(
    AppointmentId INT IDENTITY PRIMARY KEY,
    AppointmentNumber AS ('APT' + RIGHT('000000' + CAST(AppointmentId AS VARCHAR(6)),6)) PERSISTED,
    PatientId INT NOT NULL REFERENCES dbo.Patients(PatientId),
    DoctorId INT NOT NULL REFERENCES dbo.Doctors(DoctorId),
    AppointmentDate DATETIME2 NOT NULL,
    Status NVARCHAR(30) NOT NULL DEFAULT 'Scheduled',
    Reason NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Departments)
INSERT dbo.Departments(DepartmentName) VALUES ('General Medicine'),('Cardiology'),('Pediatrics'),('Orthopedics');

IF NOT EXISTS (SELECT 1 FROM dbo.Doctors)
INSERT dbo.Doctors(FullName,Specialization,PhoneNumber,Email,DepartmentId)
SELECT 'Dr. Arun Kumar','General Physician','9000000001','doctor@example.com',DepartmentId
FROM dbo.Departments WHERE DepartmentName='General Medicine';
GO

-- Demo hashes correspond to the demo passwords documented in README.
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email='admin@example.com')
INSERT dbo.Users(FullName,Email,PasswordHash,Role) VALUES
('System Admin','admin@example.com','$2a$11$1f2PjKJ0V7n9Jp1mQm6m9uQxvJ7V8Hj5Hq7x8x4gKp4vJ0G4K3b9K','Admin');
-- For a real run, replace demo password hashes using BCrypt or seed users from your deployment process.
GO

CREATE OR ALTER PROCEDURE dbo.sp_Patient_GetById @PatientId INT AS
BEGIN SELECT PatientId,PatientNumber,CONCAT(FirstName,' ',LastName) FullName,DateOfBirth,Gender,PhoneNumber,Email,BloodGroup FROM dbo.Patients WHERE PatientId=@PatientId AND IsActive=1; END
GO
CREATE OR ALTER PROCEDURE dbo.sp_Patient_GetAll AS
BEGIN SELECT PatientId,PatientNumber,CONCAT(FirstName,' ',LastName) FullName,DateOfBirth,Gender,PhoneNumber,Email,BloodGroup FROM dbo.Patients WHERE IsActive=1 ORDER BY PatientId DESC; END
GO
CREATE OR ALTER PROCEDURE dbo.sp_Patient_Create
@FirstName NVARCHAR(100),@LastName NVARCHAR(100),@DateOfBirth DATE,@Gender NVARCHAR(20),@PhoneNumber NVARCHAR(30),@Email NVARCHAR(200),@BloodGroup NVARCHAR(10)
AS BEGIN INSERT dbo.Patients(FirstName,LastName,DateOfBirth,Gender,PhoneNumber,Email,BloodGroup) VALUES(@FirstName,@LastName,@DateOfBirth,@Gender,@PhoneNumber,@Email,@BloodGroup); SELECT CAST(SCOPE_IDENTITY() AS INT); END
GO
CREATE OR ALTER PROCEDURE dbo.sp_Patient_Update
@PatientId INT,@FirstName NVARCHAR(100),@LastName NVARCHAR(100),@DateOfBirth DATE,@Gender NVARCHAR(20),@PhoneNumber NVARCHAR(30),@Email NVARCHAR(200),@BloodGroup NVARCHAR(10)
AS BEGIN UPDATE dbo.Patients SET FirstName=@FirstName,LastName=@LastName,DateOfBirth=@DateOfBirth,Gender=@Gender,PhoneNumber=@PhoneNumber,Email=@Email,BloodGroup=@BloodGroup WHERE PatientId=@PatientId AND IsActive=1; END
GO
CREATE OR ALTER PROCEDURE dbo.sp_Patient_Delete @PatientId INT AS
BEGIN UPDATE dbo.Patients SET IsActive=0 WHERE PatientId=@PatientId AND IsActive=1; END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Doctor_GetAll AS
BEGIN SELECT d.DoctorId,d.DoctorNumber,d.FullName,d.Specialization,d.PhoneNumber,d.Email,ISNULL(dp.DepartmentName,'') DepartmentName FROM dbo.Doctors d LEFT JOIN dbo.Departments dp ON dp.DepartmentId=d.DepartmentId WHERE d.IsActive=1 ORDER BY d.FullName; END
GO

CREATE OR ALTER PROCEDURE dbo.sp_Appointment_Create
@PatientId INT,@DoctorId INT,@AppointmentDate DATETIME2,@Reason NVARCHAR(500)
AS BEGIN INSERT dbo.Appointments(PatientId,DoctorId,AppointmentDate,Reason) VALUES(@PatientId,@DoctorId,@AppointmentDate,@Reason); SELECT CAST(SCOPE_IDENTITY() AS INT); END
GO
CREATE OR ALTER PROCEDURE dbo.sp_Appointment_GetById @AppointmentId INT AS
BEGIN SELECT a.AppointmentId,a.AppointmentNumber,a.PatientId,CONCAT(p.FirstName,' ',p.LastName) PatientName,a.DoctorId,d.FullName DoctorName,a.AppointmentDate,a.Status,a.Reason FROM dbo.Appointments a JOIN dbo.Patients p ON p.PatientId=a.PatientId JOIN dbo.Doctors d ON d.DoctorId=a.DoctorId WHERE a.AppointmentId=@AppointmentId; END
GO
CREATE OR ALTER PROCEDURE dbo.sp_Appointment_GetByPatient @PatientId INT AS
BEGIN SELECT a.AppointmentId,a.AppointmentNumber,a.PatientId,CONCAT(p.FirstName,' ',p.LastName) PatientName,a.DoctorId,d.FullName DoctorName,a.AppointmentDate,a.Status,a.Reason FROM dbo.Appointments a JOIN dbo.Patients p ON p.PatientId=a.PatientId JOIN dbo.Doctors d ON d.DoctorId=a.DoctorId WHERE a.PatientId=@PatientId ORDER BY a.AppointmentDate DESC; END
GO
CREATE OR ALTER PROCEDURE dbo.sp_Appointment_Cancel @AppointmentId INT AS
BEGIN UPDATE dbo.Appointments SET Status='Cancelled' WHERE AppointmentId=@AppointmentId AND Status='Scheduled'; END
GO
CREATE OR ALTER PROCEDURE dbo.sp_User_GetByEmail @Email NVARCHAR(200) AS
BEGIN SELECT UserId,FullName,Email,PasswordHash,Role FROM dbo.Users WHERE Email=@Email AND IsActive=1; END
GO
