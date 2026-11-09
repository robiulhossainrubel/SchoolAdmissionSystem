using SchoolAdmission.Application.DTOs;

namespace SchoolAdmission.Application.Interfaces;

public interface IAdmissionClassService
{
    Task<ClassCreatedResponse> CreateClassAsync(CreateClassRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ClassResponse>> GetAllClassesAsync(CancellationToken cancellationToken = default);
    Task<ClassResponse> GetClassByIdAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IHoldService
{
    Task<CreateHoldResponse> CreateHoldAsync(Guid classId, string studentId, CancellationToken cancellationToken = default);
    Task<HoldResponse> GetHoldByIdAsync(Guid holdId, CancellationToken cancellationToken = default);
    Task<ConfirmHoldResponse> ConfirmHoldAsync(Guid holdId, string studentId, CancellationToken cancellationToken = default);
    Task CancelHoldAsync(Guid holdId, string studentId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StudentHoldResponse>> GetStudentHoldsAsync(string studentId, CancellationToken cancellationToken = default);
}

