using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Infrastructure.Data;

namespace SchoolAdmission.Tests;

public class DatabaseSchemaTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public DatabaseSchemaTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task DatabaseHealthCheck_ReturnsHealthy()
    {
        var response = await _client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal("Healthy", body);
    }

    [Fact]
    public async Task Database_CanConnect_AndHasPendingMigrationsApplied()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();

        var canConnect = await db.Database.CanConnectAsync();
        Assert.True(canConnect, "Application should connect to PostgreSQL database.");

        var pendingMigrations = await db.Database.GetPendingMigrationsAsync();
        Assert.Empty(pendingMigrations);
    }

    [Fact]
    public async Task AdmissionClass_Constraint_RejectsZeroOrNegativeTotalSeats()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();

        var invalidClass = new AdmissionClass
        {
            Id = Guid.NewGuid(),
            Name = "Invalid Class",
            TotalSeats = 0, // Violates CK_admission_classes_total_seats_positive
            CreatedAtUtc = DateTime.UtcNow
        };

        db.Classes.Add(invalidClass);
        var ex = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        Assert.Contains("CK_admission_classes_total_seats_positive", ex.InnerException?.Message ?? ex.Message);
    }

    [Fact]
    public async Task AdmissionHold_Constraint_RejectsInvalidStudentIdLength()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();

        var validClass = new AdmissionClass
        {
            Id = Guid.NewGuid(),
            Name = "Test Class for Hold",
            TotalSeats = 30,
            CreatedAtUtc = DateTime.UtcNow
        };
        db.Classes.Add(validClass);
        await db.SaveChangesAsync();

        var invalidHold = new AdmissionHold
        {
            Id = Guid.NewGuid(),
            ClassId = validClass.Id,
            StudentId = "123", // Only 3 digits, violates length(student_id) = 17
            Status = HoldStatus.HELD,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(10)
        };

        db.Holds.Add(invalidHold);
        var ex = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        Assert.Contains("CK_admission_holds_student_id_17_digits", ex.InnerException?.Message ?? ex.Message);
    }

    [Fact]
    public async Task Indexes_And_ForeignKeys_AreConfiguredInModel()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();
        var model = db.Model;

        var holdEntity = model.FindEntityType(typeof(AdmissionHold));
        Assert.NotNull(holdEntity);

        // Check indexes
        var indexes = holdEntity.GetIndexes().ToList();
        Assert.Contains(indexes, i => i.GetDatabaseName() == "idx_holds_class_status_expiry");
        Assert.Contains(indexes, i => i.GetDatabaseName() == "idx_holds_student_created");

        // Check foreign key
        var fks = holdEntity.GetForeignKeys().ToList();
        Assert.Contains(fks, fk => fk.PrincipalEntityType.ClrType == typeof(AdmissionClass) && fk.DeleteBehavior == DeleteBehavior.Restrict);
    }
}

