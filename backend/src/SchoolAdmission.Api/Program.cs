using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using SchoolAdmission.Api.Formatters;
using SchoolAdmission.Api.Middleware;
using SchoolAdmission.Application.Interfaces;
using SchoolAdmission.Infrastructure.Data;
using SchoolAdmission.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var jsonOptions = new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
};
jsonOptions.Converters.Add(new JsonStringEnumConverter());

builder.Services.AddControllers(options =>
{
    options.OutputFormatters.RemoveType<SystemTextJsonOutputFormatter>();
    options.OutputFormatters.Add(new StreamJsonOutputFormatter(jsonOptions));
});

// Swagger / OpenAPI documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "School Admission System API",
        Version = "v1",
        Description = "API for School Admission System supporting temporary seat reservations (holds), admission confirmation with simulated payment, and live seat tracking."
    });

    // Add X-Student-Id parameter support in Swagger
    c.AddSecurityDefinition("StudentIdHeader", new OpenApiSecurityScheme
    {
        Name = "X-Student-Id",
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Header,
        Description = "17-digit student birth registration ID (e.g. 12345678901234567)"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "StudentIdHeader"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Database Configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=school_admission;Username=postgres;Password=postgres";

builder.Services.AddDbContext<AdmissionDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

// Register Application & Infrastructure Services
builder.Services.AddScoped<IAdmissionClassService, AdmissionClassService>();
builder.Services.AddScoped<IHoldService, HoldService>();

// Health Checks (Database & self)
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

// Global Exception Handling Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Ensure Database is created and migrations are applied on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AdmissionDbContext>();
    db.Database.Migrate();
}

// Enable Swagger in Development and Staging
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "School Admission API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowFrontend");

// Real working health check endpoint
app.MapHealthChecks("/health");

app.MapControllers();

app.Run();

// Required for WebApplicationFactory in integration tests
public partial class Program { }
