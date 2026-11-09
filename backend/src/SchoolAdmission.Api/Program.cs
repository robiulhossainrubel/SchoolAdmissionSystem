using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Database Configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=school_admission;Username=postgres;Password=postgres";

builder.Services.AddDbContext<AdmissionDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

// Health Checks (including Database connectivity check)
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AdmissionDbContext>("database");

// Configure CORS for Frontend UI
var frontendOrigin = builder.Configuration["FrontendOrigin"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(frontendOrigin)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .WithExposedHeaders("X-Student-Id");
    });
});

var app = builder.Build();

// Ensure Database is created and migrations are applied on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();
    db.Database.Migrate();
}

app.UseCors("AllowFrontend");

// Real working health check endpoint
app.MapHealthChecks("/health");

app.MapControllers();

app.Run();

// Required for WebApplicationFactory in integration tests
public partial class Program { }
