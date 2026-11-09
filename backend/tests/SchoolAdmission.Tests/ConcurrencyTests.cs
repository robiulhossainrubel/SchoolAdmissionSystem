using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Infrastructure.Data;

namespace SchoolAdmission.Tests;

public class ConcurrencyTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public ConcurrencyTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    /// <summary>
    /// Mandatory Assignment Concurrency Test:
    /// - Offering capacity = 10
    /// - 100 simultaneous hold requests launched in parallel
    /// - 100 distinct 17-digit student IDs
    /// - Exactly 10 requests must succeed (HTTP 201 Created)
    /// - Exactly 90 requests must be rejected (HTTP 409 Conflict)
    /// - Database invariant confirmed + active held <= totalSeats must hold
    /// - Zero unexpected 500 Internal Server Errors
    /// </summary>
    [Fact]
    public async Task Mandatory_100ConcurrentHoldRequests_AgainstCapacity10_Exactly10Succeed()
    {
        // 1. Arrange: Create offering with totalSeats = 10
        var offeringName = $"Concurrency Offering {Guid.NewGuid():N}";
        const int capacity = 10;
        const int totalRequests = 100;

        var createClassResp = await _client.PostAsJsonAsync("/classes", new CreateClassRequest(offeringName, capacity));
        createClassResp.EnsureSuccessStatusCode();
        var offering = await createClassResp.Content.ReadFromJsonAsync<ClassCreatedResponse>(JsonOptions);
        Assert.NotNull(offering);

        // 2. Prepare 100 distinct valid 17-digit student IDs
        var studentIds = Enumerable.Range(1, totalRequests)
            .Select(i => $"9{i:D16}")
            .ToList();
        Assert.Equal(totalRequests, studentIds.Distinct().Count());
        Assert.All(studentIds, id => Assert.Equal(17, id.Length));

        var responses = new ConcurrentBag<(HttpStatusCode StatusCode, string Content)>();

        // 3. Act: Fire 100 simultaneous hold requests using Task.WhenAll
        var tasks = studentIds.Select(async studentId =>
        {
            // Use independent client instance per simulated applicant
            var localClient = _factory.CreateClient();
            using var request = new HttpRequestMessage(HttpMethod.Post, $"/classes/{offering.Id}/holds");
            request.Headers.Add("X-Student-Id", studentId);

            var resp = await localClient.SendAsync(request);
            var content = await resp.Content.ReadAsStringAsync();
            responses.Add((resp.StatusCode, content));
        });

        await Task.WhenAll(tasks);

        // 4. Assert response statuses
        var list = responses.ToList();
        var grouped = string.Join(", ", list.GroupBy(r => r.StatusCode).Select(g => $"{g.Key}: {g.Count()}"));
        var nonSuccess = list.Where(r => r.StatusCode != HttpStatusCode.Created && r.StatusCode != HttpStatusCode.Conflict).Select(r => $"{r.StatusCode}: {r.Content}").ToList();
        var details = nonSuccess.Count > 0 ? " Non-standard: " + string.Join("; ", nonSuccess) : "";

        var successCount = list.Count(r => r.StatusCode == HttpStatusCode.Created);
        var conflictCount = list.Count(r => r.StatusCode == HttpStatusCode.Conflict);
        var serverErrorCount = list.Count(r => (int)r.StatusCode >= 500);

        Assert.True(serverErrorCount == 0, $"Expected 0 server errors, found {serverErrorCount}. Breakdown: {grouped}.{details}");
        Assert.Equal(capacity, successCount);
        Assert.True(conflictCount == totalRequests - capacity, $"Expected {totalRequests - capacity} conflicts, got {conflictCount}. Breakdown: {grouped}.{details}");

        // 5. Assert database state directly in PostgreSQL
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();

        var heldInDb = await db.Holds
            .Where(h => h.ClassId == offering.Id && h.Status == HoldStatus.HELD)
            .CountAsync();

        Assert.Equal(capacity, heldInDb);

        // Verify class capacity breakdown via GET endpoint
        var classResp = await _client.GetAsync($"/classes/{offering.Id}");
        var classDetails = await classResp.Content.ReadFromJsonAsync<ClassResponse>(JsonOptions);
        Assert.NotNull(classDetails);
        Assert.Equal(capacity, classDetails.HeldSeats);
        Assert.Equal(0, classDetails.ConfirmedSeats);
        Assert.Equal(0, classDetails.AvailableSeats);
    }

    /// <summary>
    /// Concurrency Test: Competing Holds and Confirmations
    /// - Offering capacity = 5
    /// - 30 applicants compete while previous holds are confirmed concurrently
    /// - Capacity must never exceed totalSeats at any point in time
    /// </summary>
    [Fact]
    public async Task Concurrent_HoldsAndConfirmations_NeverOversellsSeats()
    {
        const int capacity = 5;
        const int applicants = 30;

        var offeringName = $"Hold+Confirm Stress {Guid.NewGuid():N}";
        var createClassResp = await _client.PostAsJsonAsync("/classes", new CreateClassRequest(offeringName, capacity));
        var offering = await createClassResp.Content.ReadFromJsonAsync<ClassCreatedResponse>(JsonOptions);
        Assert.NotNull(offering);

        var studentIds = Enumerable.Range(1, applicants)
            .Select(i => $"8{i:D16}")
            .ToList();

        var successHolds = new ConcurrentBag<CreateHoldResponse>();

        var holdTasks = studentIds.Select(async studentId =>
        {
            var localClient = _factory.CreateClient();
            using var req = new HttpRequestMessage(HttpMethod.Post, $"/classes/{offering.Id}/holds");
            req.Headers.Add("X-Student-Id", studentId);
            var resp = await localClient.SendAsync(req);

            if (resp.StatusCode == HttpStatusCode.Created)
            {
                var hold = await resp.Content.ReadFromJsonAsync<CreateHoldResponse>(JsonOptions);
                if (hold != null)
                {
                    successHolds.Add(hold);

                    // Concurrently confirm immediately
                    using var confirmReq = new HttpRequestMessage(HttpMethod.Post, $"/holds/{hold.HoldId}/confirm");
                    confirmReq.Headers.Add("X-Student-Id", studentId);
                    await localClient.SendAsync(confirmReq);
                }
            }
        });

        await Task.WhenAll(holdTasks);

        // Database Verification: confirmed + unexpired held <= capacity
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();

        var holdsInDb = await db.Holds.Where(h => h.ClassId == offering.Id).ToListAsync();
        var confirmedCount = holdsInDb.Count(h => h.Status == HoldStatus.CONFIRMED);
        var heldCount = holdsInDb.Count(h => h.Status == HoldStatus.HELD);
        var holdDetails = string.Join("; ", holdsInDb.Select(h => $"[{h.Id}, {h.StudentId}, {h.Status}, Created:{h.CreatedAtUtc:O}, Exp:{h.ExpiresAtUtc:O}, Confirmed:{h.ConfirmedAtUtc:O}]"));

        Assert.True(confirmedCount + heldCount <= capacity,
            $"Invariant violated: confirmed ({confirmedCount}) + held ({heldCount}) > capacity ({capacity}). All holds in DB ({holdsInDb.Count}): {holdDetails}");
        Assert.Equal(capacity, confirmedCount + heldCount);
    }
}
