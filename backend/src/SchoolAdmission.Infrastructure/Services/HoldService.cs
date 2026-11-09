using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;
using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Domain.Exceptions;
using SchoolAdmission.Infrastructure.Data;

namespace SchoolAdmission.Infrastructure.Services;

public class HoldService : IHoldService
{
    private readonly AdmissionDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<HoldService> _logger;

    public HoldService(AdmissionDbContext dbContext, IConfiguration configuration, ILogger<HoldService> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<CreateHoldResponse> CreateHoldAsync(Guid classId, string studentId, CancellationToken cancellationToken = default)
    {
        var holdDurationSeconds = 600;
        if (int.TryParse(_configuration["HOLD_DURATION_SECONDS"], out var parsed) && parsed > 0)
        {
            holdDurationSeconds = parsed;
        }

        // Transaction with explicit row-level locking on the class offering row
        using var transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);

        // 1. Pessimistic lock on the offering row via SELECT ... FOR UPDATE
        var offering = await _dbContext.Classes
            .FromSqlInterpolated($"SELECT * FROM admission_classes WHERE id = {classId} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);

        if (offering == null)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new NotFoundException($"Class offering with ID '{classId}' was not found.");
        }

        var nowUtc = DateTime.UtcNow;

        // 2. Mark expired HELD holds for this class as EXPIRED
        await _dbContext.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE admission_holds SET status = 'EXPIRED' WHERE class_id = {classId} AND status = 'HELD' AND expires_at_utc <= {nowUtc}",
            cancellationToken);

        // 3. Single atomic query: Count active reservations (CONFIRMED + unexpired HELD)
        var consumedSeats = await _dbContext.Holds
            .CountAsync(h => h.ClassId == classId && 
                (h.Status == HoldStatus.CONFIRMED || (h.Status == HoldStatus.HELD && h.ExpiresAtUtc > nowUtc)),
                cancellationToken);

        // 4. Verify capacity
        if (consumedSeats >= offering.TotalSeats)
        {
            _logger.LogWarning("Sold out: class {ClassId} has {Consumed} consumed seats of {Total} total seats",
                classId, consumedSeats, offering.TotalSeats);
            await transaction.RollbackAsync(cancellationToken);
            throw new ConflictException("No seats available for this class offering.");
        }

        // 5. Verify single active hold/admission policy per student per offering
        var hasActiveHoldOrConfirmed = await _dbContext.Holds
            .AnyAsync(h => h.ClassId == classId && h.StudentId == studentId &&
                (h.Status == HoldStatus.CONFIRMED || (h.Status == HoldStatus.HELD && h.ExpiresAtUtc > nowUtc)),
                cancellationToken);

        if (hasActiveHoldOrConfirmed)
        {
            _logger.LogWarning("Duplicate application: student {StudentId} already has an active hold or confirmed admission in class {ClassId}",
                studentId, classId);
            await transaction.RollbackAsync(cancellationToken);
            throw new ConflictException("Student already holds an active reservation or confirmed seat in this class.");
        }

        // 6. Insert new reservation
        var expiresAtUtc = nowUtc.AddSeconds(holdDurationSeconds);
        var hold = new AdmissionHold
        {
            Id = Guid.NewGuid(),
            ClassId = classId,
            StudentId = studentId,
            Status = HoldStatus.HELD,
            CreatedAtUtc = nowUtc,
            ExpiresAtUtc = expiresAtUtc
        };

        _dbContext.Holds.Add(hold);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        _logger.LogInformation("Hold {HoldId} created for student {StudentId} on class {ClassId}, expires at {ExpiresAtUtc}",
            hold.Id, studentId, classId, expiresAtUtc);

        return new CreateHoldResponse(
            hold.Id,
            hold.ClassId,
            hold.StudentId,
            hold.Status.ToString(),
            hold.ExpiresAtUtc
        );
    }

    public async Task<HoldResponse> GetHoldByIdAsync(Guid holdId, CancellationToken cancellationToken = default)
    {
        var hold = await _dbContext.Holds
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == holdId, cancellationToken);

        if (hold == null)
        {
            throw new NotFoundException($"Hold with ID '{holdId}' was not found.");
        }

        var status = hold.Status;
        if (status == HoldStatus.HELD && hold.ExpiresAtUtc <= DateTime.UtcNow)
        {
            status = HoldStatus.EXPIRED;
        }

        return new HoldResponse(
            hold.Id,
            hold.ClassId,
            status.ToString(),
            hold.ExpiresAtUtc
        );
    }

    public async Task<ConfirmHoldResponse> ConfirmHoldAsync(Guid holdId, string studentId, CancellationToken cancellationToken = default)
    {
        using var transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);

        // Find hold first to identify parent class
        var existingHold = await _dbContext.Holds.AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == holdId, cancellationToken);

        if (existingHold == null)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new NotFoundException($"Hold with ID '{holdId}' was not found.");
        }

        // Acquire lock on parent offering row in consistent hierarchical order
        await _dbContext.Classes
            .FromSqlInterpolated($"SELECT * FROM admission_classes WHERE id = {existingHold.ClassId} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);

        // Lock the hold row
        var hold = await _dbContext.Holds
            .FromSqlInterpolated($"SELECT * FROM admission_holds WHERE id = {holdId} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);

        if (hold == null)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new NotFoundException($"Hold with ID '{holdId}' was not found.");
        }

        // Verify student ownership
        if (!string.Equals(hold.StudentId, studentId, StringComparison.Ordinal))
        {
            _logger.LogWarning("Forbidden: student {HeaderStudentId} tried to confirm hold {HoldId} owned by {OwnerStudentId}",
                studentId, holdId, hold.StudentId);
            await transaction.RollbackAsync(cancellationToken);
            throw new ForbiddenException("You are not authorized to confirm this hold.");
        }

        // Idempotency check: if already confirmed, return success without altering counters
        if (hold.Status == HoldStatus.CONFIRMED)
        {
            await transaction.CommitAsync(cancellationToken);
            return new ConfirmHoldResponse(hold.Id, hold.Status.ToString());
        }

        var nowUtc = DateTime.UtcNow;

        // Verify state is HELD and not expired
        if (hold.Status != HoldStatus.HELD || hold.ExpiresAtUtc <= nowUtc)
        {
            if (hold.Status == HoldStatus.HELD)
            {
                hold.Status = HoldStatus.EXPIRED;
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            _logger.LogWarning("Invalid confirmation: hold {HoldId} has status {Status} with expiry {ExpiresAtUtc}",
                holdId, hold.Status, hold.ExpiresAtUtc);
            await transaction.CommitAsync(cancellationToken);
            throw new ConflictException("Hold has expired or is in an invalid state for confirmation.");
        }

        // Confirm admission
        hold.Status = HoldStatus.CONFIRMED;
        hold.ConfirmedAtUtc = nowUtc;

        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        _logger.LogInformation("Hold {HoldId} confirmed for student {StudentId} at {ConfirmedAtUtc}",
            hold.Id, studentId, nowUtc);

        return new ConfirmHoldResponse(hold.Id, hold.Status.ToString());
    }

    public async Task CancelHoldAsync(Guid holdId, string studentId, CancellationToken cancellationToken = default)
    {
        using var transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);

        var existingHold = await _dbContext.Holds.AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == holdId, cancellationToken);

        if (existingHold == null)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new NotFoundException($"Hold with ID '{holdId}' was not found.");
        }

        // Consistent lock order: parent class first
        await _dbContext.Classes
            .FromSqlInterpolated($"SELECT * FROM admission_classes WHERE id = {existingHold.ClassId} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);

        var hold = await _dbContext.Holds
            .FromSqlInterpolated($"SELECT * FROM admission_holds WHERE id = {holdId} FOR UPDATE")
            .FirstOrDefaultAsync(cancellationToken);

        if (hold == null)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new NotFoundException($"Hold with ID '{holdId}' was not found.");
        }

        if (!string.Equals(hold.StudentId, studentId, StringComparison.Ordinal))
        {
            _logger.LogWarning("Forbidden: student {HeaderStudentId} tried to cancel hold {HoldId} owned by {OwnerStudentId}",
                studentId, holdId, hold.StudentId);
            await transaction.RollbackAsync(cancellationToken);
            throw new ForbiddenException("You are not authorized to cancel this hold.");
        }

        if (hold.Status == HoldStatus.CONFIRMED)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new ConflictException("Cannot cancel a confirmed admission.");
        }

        if (hold.Status == HoldStatus.CANCELLED)
        {
            // Already cancelled, idempotent success
            await transaction.CommitAsync(cancellationToken);
            return;
        }

        hold.Status = HoldStatus.CANCELLED;
        hold.CancelledAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        _logger.LogInformation("Hold {HoldId} cancelled for student {StudentId}", holdId, studentId);
    }

    public async Task<IReadOnlyList<StudentHoldResponse>> GetStudentHoldsAsync(string studentId, CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;

        var holds = await _dbContext.Holds
            .Include(h => h.Class)
            .AsNoTracking()
            .Where(h => h.StudentId == studentId)
            .OrderByDescending(h => h.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return holds.Select(h =>
        {
            var status = h.Status;
            if (status == HoldStatus.HELD && h.ExpiresAtUtc <= nowUtc)
            {
                status = HoldStatus.EXPIRED;
            }

            return new StudentHoldResponse(
                h.Id,
                h.ClassId,
                h.Class?.Name ?? string.Empty,
                status.ToString(),
                h.ExpiresAtUtc
            );
        }).ToList();
    }
}
