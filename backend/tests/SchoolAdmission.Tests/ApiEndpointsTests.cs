using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Domain.Entities;
using SchoolAdmission.Domain.Enums;
using SchoolAdmission.Infrastructure.Data;

namespace SchoolAdmission.Tests;

public class ApiEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public ApiEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PostClasses_ValidRequest_Returns201Created_WithExactFields()
    {
        var request = new CreateClassRequest("Class 6 - Morning Shift", 120);

        var response = await _client.PostAsJsonAsync("/classes", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<ClassCreatedResponse>(JsonOptions);
        Assert.NotNull(created);
        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal("Class 6 - Morning Shift", created.Name);
        Assert.Equal(120, created.TotalSeats);
    }

    [Theory]
    [InlineData("", 50)]
    [InlineData("   ", 50)]
    [InlineData("Valid Name", 0)]
    [InlineData("Valid Name", -10)]
    public async Task PostClasses_InvalidInput_Returns400BadRequest(string name, int totalSeats)
    {
        var request = new { name, totalSeats };

        var response = await _client.PostAsJsonAsync("/classes", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
    }

    [Fact]
    public async Task GetClasses_Returns200OK_WithCapacityCounters()
    {
        // Arrange
        var className = $"Test Class List {Guid.NewGuid():N}";
        var createResponse = await _client.PostAsJsonAsync("/classes", new CreateClassRequest(className, 50));
        createResponse.EnsureSuccessStatusCode();

        // Act
        var response = await _client.GetAsync("/classes");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var classes = await response.Content.ReadFromJsonAsync<List<ClassResponse>>(JsonOptions);
        Assert.NotNull(classes);
        var found = classes.FirstOrDefault(c => c.Name == className);
        Assert.NotNull(found);
        Assert.Equal(50, found.TotalSeats);
        Assert.Equal(0, found.HeldSeats);
        Assert.Equal(0, found.ConfirmedSeats);
        Assert.Equal(50, found.AvailableSeats);
    }

    [Fact]
    public async Task GetClassById_ExistingClass_Returns200OK()
    {
        var createResponse = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Details Test Class", 40));
        var created = await createResponse.Content.ReadFromJsonAsync<ClassCreatedResponse>(JsonOptions);
        Assert.NotNull(created);

        var response = await _client.GetAsync($"/classes/{created.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var offering = await response.Content.ReadFromJsonAsync<ClassResponse>(JsonOptions);
        Assert.NotNull(offering);
        Assert.Equal(created.Id, offering.Id);
        Assert.Equal(40, offering.TotalSeats);
    }

    [Fact]
    public async Task GetClassById_NonExistentClass_Returns404NotFound()
    {
        var nonExistentId = Guid.NewGuid();

        var response = await _client.GetAsync($"/classes/{nonExistentId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Contains(nonExistentId.ToString(), problem.Detail);
    }

    [Theory]
    [InlineData("")]                          // Missing/empty
    [InlineData("1234567890123456")]          // 16 digits
    [InlineData("123456789012345678")]        // 18 digits
    [InlineData("1234567890123456A")]        // Letters
    public async Task Endpoints_WithInvalidStudentIdHeader_Return400BadRequest(string invalidId)
    {
        var classId = Guid.NewGuid();
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/classes/{classId}/holds");
        if (!string.IsNullOrEmpty(invalidId))
        {
            request.Headers.Add("X-Student-Id", invalidId);
        }

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
    }

    [Fact]
    public async Task CreateHold_ValidHeaderAndAvailableSeats_Returns201Created()
    {
        var createClassResp = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Hold Test Class", 20));
        var offering = await createClassResp.Content.ReadFromJsonAsync<ClassCreatedResponse>(JsonOptions);
        Assert.NotNull(offering);

        var studentId = "20152691234567890";
        using var holdReq = new HttpRequestMessage(HttpMethod.Post, $"/classes/{offering.Id}/holds");
        holdReq.Headers.Add("X-Student-Id", studentId);

        var holdResp = await _client.SendAsync(holdReq);

        Assert.Equal(HttpStatusCode.Created, holdResp.StatusCode);
        var hold = await holdResp.Content.ReadFromJsonAsync<CreateHoldResponse>(JsonOptions);
        Assert.NotNull(hold);
        Assert.NotEqual(Guid.Empty, hold.HoldId);
        Assert.Equal(offering.Id, hold.ClassId);
        Assert.Equal(studentId, hold.StudentId);
        Assert.Equal("HELD", hold.Status);
        Assert.True(hold.ExpiresAt > DateTime.UtcNow);
    }

    [Fact]
    public async Task CreateHold_DuplicateStudent_Returns409Conflict()
    {
        var createClassResp = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Dup Student Class", 20));
        var offering = await createClassResp.Content.ReadFromJsonAsync<ClassCreatedResponse>(JsonOptions);
        Assert.NotNull(offering);

        var studentId = "20152699999999999";

        // First hold
        using var req1 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{offering.Id}/holds");
        req1.Headers.Add("X-Student-Id", studentId);
        var resp1 = await _client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.Created, resp1.StatusCode);

        // Second hold by same student for same class
        using var req2 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{offering.Id}/holds");
        req2.Headers.Add("X-Student-Id", studentId);
        var resp2 = await _client.SendAsync(req2);

        Assert.Equal(HttpStatusCode.Conflict, resp2.StatusCode);
        var problem = await resp2.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Contains("already holds an active reservation", problem.Detail);
    }

    [Fact]
    public async Task CreateHold_SoldOut_Returns409Conflict()
    {
        // Class with only 1 seat
        var createClassResp = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("One Seat Class", 1));
        var offering = await createClassResp.Content.ReadFromJsonAsync<ClassCreatedResponse>(JsonOptions);
        Assert.NotNull(offering);

        // First student reserves the only seat
        using var req1 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{offering.Id}/holds");
        req1.Headers.Add("X-Student-Id", "11111111111111111");
        var resp1 = await _client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.Created, resp1.StatusCode);

        // Second student attempts to reserve
        using var req2 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{offering.Id}/holds");
        req2.Headers.Add("X-Student-Id", "22222222222222222");
        var resp2 = await _client.SendAsync(req2);

        Assert.Equal(HttpStatusCode.Conflict, resp2.StatusCode);
        var problem = await resp2.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Contains("No seats available", problem.Detail);
    }

    [Fact]
    public async Task GetHold_ExistingHold_Returns200OK_WithDetails()
    {
        var createClassResp = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Lookup Class", 10));
        var offering = await createClassResp.Content.ReadFromJsonAsync<ClassCreatedResponse>(JsonOptions);
        Assert.NotNull(offering);

        var studentId = "33333333333333333";
        using var holdReq = new HttpRequestMessage(HttpMethod.Post, $"/classes/{offering.Id}/holds");
        holdReq.Headers.Add("X-Student-Id", studentId);
        var holdResp = await _client.SendAsync(holdReq);
        var hold = await holdResp.Content.ReadFromJsonAsync<CreateHoldResponse>(JsonOptions);
        Assert.NotNull(hold);

        var getResp = await _client.GetAsync($"/holds/{hold.HoldId}");

        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
        var details = await getResp.Content.ReadFromJsonAsync<HoldResponse>(JsonOptions);
        Assert.NotNull(details);
        Assert.Equal(hold.HoldId, details.HoldId);
        Assert.Equal(offering.Id, details.ClassId);
        Assert.Equal("HELD", details.Status);
    }

    [Fact]
    public async Task ConfirmHold_ValidStudentOwner_Returns200OK_Confirmed()
    {
        var createClassResp = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Confirm Class", 10));
        var offering = await createClassResp.Content.ReadFromJsonAsync<ClassCreatedResponse>(JsonOptions);
        Assert.NotNull(offering);

        var studentId = "44444444444444444";
        using var holdReq = new HttpRequestMessage(HttpMethod.Post, $"/classes/{offering.Id}/holds");
        holdReq.Headers.Add("X-Student-Id", studentId);
        var holdResp = await _client.SendAsync(holdReq);
        var hold = await holdResp.Content.ReadFromJsonAsync<CreateHoldResponse>(JsonOptions);
        Assert.NotNull(hold);

        // Confirm hold
        using var confirmReq = new HttpRequestMessage(HttpMethod.Post, $"/holds/{hold.HoldId}/confirm");
        confirmReq.Headers.Add("X-Student-Id", studentId);
        var confirmResp = await _client.SendAsync(confirmReq);

        Assert.Equal(HttpStatusCode.OK, confirmResp.StatusCode);
        var confirmResult = await confirmResp.Content.ReadFromJsonAsync<ConfirmHoldResponse>(JsonOptions);
        Assert.NotNull(confirmResult);
        Assert.Equal(hold.HoldId, confirmResult.HoldId);
        Assert.Equal("CONFIRMED", confirmResult.Status);

        // Idempotent: confirm again returns 200 OK
        using var confirmReq2 = new HttpRequestMessage(HttpMethod.Post, $"/holds/{hold.HoldId}/confirm");
        confirmReq2.Headers.Add("X-Student-Id", studentId);
        var confirmResp2 = await _client.SendAsync(confirmReq2);
        Assert.Equal(HttpStatusCode.OK, confirmResp2.StatusCode);
    }

    [Fact]
    public async Task ConfirmHold_OtherStudent_Returns403Forbidden()
    {
        var createClassResp = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Forbidden Confirm Class", 10));
        var offering = await createClassResp.Content.ReadFromJsonAsync<ClassCreatedResponse>(JsonOptions);
        Assert.NotNull(offering);

        var ownerStudentId = "55555555555555555";
        var attackerStudentId = "66666666666666666";

        using var holdReq = new HttpRequestMessage(HttpMethod.Post, $"/classes/{offering.Id}/holds");
        holdReq.Headers.Add("X-Student-Id", ownerStudentId);
        var holdResp = await _client.SendAsync(holdReq);
        var hold = await holdResp.Content.ReadFromJsonAsync<CreateHoldResponse>(JsonOptions);
        Assert.NotNull(hold);

        // Attacker attempts confirmation
        using var confirmReq = new HttpRequestMessage(HttpMethod.Post, $"/holds/{hold.HoldId}/confirm");
        confirmReq.Headers.Add("X-Student-Id", attackerStudentId);
        var confirmResp = await _client.SendAsync(confirmReq);

        Assert.Equal(HttpStatusCode.Forbidden, confirmResp.StatusCode);
    }

    [Fact]
    public async Task ConfirmHold_ExpiredHold_Returns409Conflict()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();

        var offering = new AdmissionClass { Id = Guid.NewGuid(), Name = "Expired Test", TotalSeats = 5 };
        var studentId = "77777777777777777";
        var expiredHold = new AdmissionHold
        {
            Id = Guid.NewGuid(),
            ClassId = offering.Id,
            StudentId = studentId,
            Status = HoldStatus.HELD,
            CreatedAtUtc = DateTime.UtcNow.AddMinutes(-20),
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(-10) // Already expired
        };

        db.Classes.Add(offering);
        db.Holds.Add(expiredHold);
        await db.SaveChangesAsync();

        using var confirmReq = new HttpRequestMessage(HttpMethod.Post, $"/holds/{expiredHold.Id}/confirm");
        confirmReq.Headers.Add("X-Student-Id", studentId);
        var confirmResp = await _client.SendAsync(confirmReq);

        Assert.Equal(HttpStatusCode.Conflict, confirmResp.StatusCode);
        var problem = await confirmResp.Content.ReadFromJsonAsync<ProblemDetails>(JsonOptions);
        Assert.NotNull(problem);
        Assert.Contains("expired", problem.Detail, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CancelHold_ValidOwner_Returns204NoContent_AndReleasesSeat()
    {
        var createClassResp = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Cancel Test Class", 10));
        var offering = await createClassResp.Content.ReadFromJsonAsync<ClassCreatedResponse>(JsonOptions);
        Assert.NotNull(offering);

        var studentId = "88888888888888888";
        using var holdReq = new HttpRequestMessage(HttpMethod.Post, $"/classes/{offering.Id}/holds");
        holdReq.Headers.Add("X-Student-Id", studentId);
        var holdResp = await _client.SendAsync(holdReq);
        var hold = await holdResp.Content.ReadFromJsonAsync<CreateHoldResponse>(JsonOptions);
        Assert.NotNull(hold);

        // Cancel
        using var cancelReq = new HttpRequestMessage(HttpMethod.Delete, $"/holds/{hold.HoldId}");
        cancelReq.Headers.Add("X-Student-Id", studentId);
        var cancelResp = await _client.SendAsync(cancelReq);

        Assert.Equal(HttpStatusCode.NoContent, cancelResp.StatusCode);

        // Verify status is CANCELLED
        var getResp = await _client.GetAsync($"/holds/{hold.HoldId}");
        var details = await getResp.Content.ReadFromJsonAsync<HoldResponse>(JsonOptions);
        Assert.NotNull(details);
        Assert.Equal("CANCELLED", details.Status);
    }

    [Fact]
    public async Task CancelHold_OtherStudent_Returns403Forbidden()
    {
        var createClassResp = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Cancel Forbidden Class", 10));
        var offering = await createClassResp.Content.ReadFromJsonAsync<ClassCreatedResponse>(JsonOptions);
        Assert.NotNull(offering);

        var ownerStudentId = "99999999999999991";
        var attackerStudentId = "99999999999999992";

        using var holdReq = new HttpRequestMessage(HttpMethod.Post, $"/classes/{offering.Id}/holds");
        holdReq.Headers.Add("X-Student-Id", ownerStudentId);
        var holdResp = await _client.SendAsync(holdReq);
        var hold = await holdResp.Content.ReadFromJsonAsync<CreateHoldResponse>(JsonOptions);
        Assert.NotNull(hold);

        using var cancelReq = new HttpRequestMessage(HttpMethod.Delete, $"/holds/{hold.HoldId}");
        cancelReq.Headers.Add("X-Student-Id", attackerStudentId);
        var cancelResp = await _client.SendAsync(cancelReq);

        Assert.Equal(HttpStatusCode.Forbidden, cancelResp.StatusCode);
    }

    [Fact]
    public async Task GetMyHolds_ReturnsHoldsForStudent()
    {
        var studentId = "10101010101010101";
        var createClassResp = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("My Holds Class", 15));
        var offering = await createClassResp.Content.ReadFromJsonAsync<ClassCreatedResponse>(JsonOptions);
        Assert.NotNull(offering);

        using var holdReq = new HttpRequestMessage(HttpMethod.Post, $"/classes/{offering.Id}/holds");
        holdReq.Headers.Add("X-Student-Id", studentId);
        var holdResp = await _client.SendAsync(holdReq);
        var hold = await holdResp.Content.ReadFromJsonAsync<CreateHoldResponse>(JsonOptions);
        Assert.NotNull(hold);

        // Query /me/holds
        using var meReq = new HttpRequestMessage(HttpMethod.Get, "/me/holds");
        meReq.Headers.Add("X-Student-Id", studentId);
        var meResp = await _client.SendAsync(meReq);

        Assert.Equal(HttpStatusCode.OK, meResp.StatusCode);
        var myHolds = await meResp.Content.ReadFromJsonAsync<List<StudentHoldResponse>>(JsonOptions);
        Assert.NotNull(myHolds);
        var found = myHolds.FirstOrDefault(h => h.HoldId == hold.HoldId);
        Assert.NotNull(found);
        Assert.Equal("My Holds Class", found.ClassName);
        Assert.Equal("HELD", found.Status);
    }
}

