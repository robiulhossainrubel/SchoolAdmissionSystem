using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;
using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Domain.Exceptions;
using SchoolAdmission.Infrastructure.Data;

namespace SchoolAdmission.Infrastructure.Services;

public class AdmissionClassService : IAdmissionClassService
{
    private readonly AdmissionDbContext _dbContext;
    private readonly ILogger<AdmissionClassService> _logger;

    public AdmissionClassService(AdmissionDbContext dbContext, ILogger<AdmissionClassService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<ClassCreatedResponse> CreateClassAsync(CreateClassRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ValidationException("Class name cannot be empty or whitespace.");
        }

        if (request.TotalSeats <= 0)
        {
            throw new ValidationException("Total seats must be greater than zero.");
        }

        var offering = new AdmissionClass
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            TotalSeats = request.TotalSeats,
            CreatedAtUtc = DateTime.UtcNow
        };

        _dbContext.Classes.Add(offering);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created class offering {OfferingId}: {Name} with {TotalSeats} seats", offering.Id, offering.Name, offering.TotalSeats);

        return new ClassCreatedResponse(offering.Id, offering.Name, offering.TotalSeats);
    }

    public async Task<IReadOnlyList<ClassResponse>> GetAllClassesAsync(CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;

        var classes = await _dbContext.Classes
            .AsNoTracking()
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var classIds = classes.Select(c => c.Id).ToList();

        // Calculate counts in memory / grouped query for high performance
        var activeHolds = await _dbContext.Holds
            .AsNoTracking()
            .Where(h => classIds.Contains(h.ClassId) && (h.Status == HoldStatus.CONFIRMED || (h.Status == HoldStatus.HELD && h.ExpiresAtUtc > nowUtc)))
            .GroupBy(h => new { h.ClassId, h.Status })
            .Select(g => new
            {
                g.Key.ClassId,
                g.Key.Status,
                Count = g.Count()
            })
            .ToListAsync(cancellationToken);

        var response = classes.Select(c =>
        {
            var confirmedCount = activeHolds.FirstOrDefault(h => h.ClassId == c.Id && h.Status == HoldStatus.CONFIRMED)?.Count ?? 0;
            var heldCount = activeHolds.FirstOrDefault(h => h.ClassId == c.Id && h.Status == HoldStatus.HELD)?.Count ?? 0;
            var availableCount = Math.Max(0, c.TotalSeats - confirmedCount - heldCount);

            return new ClassResponse(
                c.Id,
                c.Name,
                c.TotalSeats,
                heldCount,
                confirmedCount,
                availableCount
            );
        }).ToList();

        return response;
    }

    public async Task<ClassResponse> GetClassByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var offering = await _dbContext.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (offering == null)
        {
            throw new NotFoundException($"Class offering with ID '{id}' was not found.");
        }

        var nowUtc = DateTime.UtcNow;

        var confirmedCount = await _dbContext.Holds
            .CountAsync(h => h.ClassId == id && h.Status == HoldStatus.CONFIRMED, cancellationToken);

        var heldCount = await _dbContext.Holds
            .CountAsync(h => h.ClassId == id && h.Status == HoldStatus.HELD && h.ExpiresAtUtc > nowUtc, cancellationToken);

        var availableCount = Math.Max(0, offering.TotalSeats - confirmedCount - heldCount);

        return new ClassResponse(
            offering.Id,
            offering.Name,
            offering.TotalSeats,
            heldCount,
            confirmedCount,
            availableCount
        );
    }
}

