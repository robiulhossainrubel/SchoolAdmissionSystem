using System.ComponentModel.DataAnnotations;

namespace SchoolAdmission.Application.DTOs;

public record CreateClassRequest(
    [Required(ErrorMessage = "Class name is required.")]
    [StringLength(150, MinimumLength = 1, ErrorMessage = "Class name must be between 1 and 150 characters.")]
    string Name,

    [Range(1, int.MaxValue, ErrorMessage = "Total seats must be greater than zero.")]
    int TotalSeats
);

public record ClassCreatedResponse(
    Guid Id,
    string Name,
    int TotalSeats
);

public record ClassResponse(
    Guid Id,
    string Name,
    int TotalSeats,
    int HeldSeats,
    int ConfirmedSeats,
    int AvailableSeats
);

public record CreateHoldResponse(
    Guid HoldId,
    Guid ClassId,
    string StudentId,
    string Status,
    DateTime ExpiresAt
);

public record HoldResponse(
    Guid HoldId,
    Guid ClassId,
    string Status,
    DateTime ExpiresAt
);

public record ConfirmHoldResponse(
    Guid HoldId,
    string Status
);

public record StudentHoldResponse(
    Guid HoldId,
    Guid ClassId,
    string ClassName,
    string Status,
    DateTime ExpiresAt
);

