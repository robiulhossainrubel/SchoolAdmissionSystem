using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.Filters;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("classes")]
public class ClassesController : ControllerBase
{
    private readonly IAdmissionClassService _classService;
    private readonly IHoldService _holdService;
    private readonly ILogger<ClassesController> _logger;

    public ClassesController(
        IAdmissionClassService classService,
        IHoldService holdService,
        ILogger<ClassesController> logger)
    {
        _classService = classService;
        _holdService = holdService;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new class/shift offering.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ClassCreatedResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateClass([FromBody] CreateClassRequest request, CancellationToken cancellationToken)
    {
        var result = await _classService.CreateClassAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetClassById), new { classId = result.Id }, result);
    }

    /// <summary>
    /// Lists all class offerings with capacity counters.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ClassResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetClasses(CancellationToken cancellationToken)
    {
        var result = await _classService.GetAllClassesAsync(cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Gets details and capacity counters for a single class offering.
    /// </summary>
    [HttpGet("{classId:guid}")]
    [ProducesResponseType(typeof(ClassResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetClassById([FromRoute] Guid classId, CancellationToken cancellationToken)
    {
        var result = await _classService.GetClassByIdAsync(classId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Requests a temporary seat hold for a student.
    /// </summary>
    [HttpPost("{classId:guid}/holds")]
    [RequireStudentId]
    [ProducesResponseType(typeof(CreateHoldResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateHold([FromRoute] Guid classId, CancellationToken cancellationToken)
    {
        var studentId = (string)HttpContext.Items["StudentId"]!;
        var result = await _holdService.CreateHoldAsync(classId, studentId, cancellationToken);

        return CreatedAtAction(
            actionName: nameof(HoldsController.GetHold),
            controllerName: "Holds",
            routeValues: new { holdId = result.HoldId },
            value: result);
    }
}

