using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.Filters;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("me")]
public class MeController : ControllerBase
{
    private readonly IHoldService _holdService;

    public MeController(IHoldService holdService)
    {
        _holdService = holdService;
    }

    /// <summary>
    /// Lists all holds and applications for the student specified in X-Student-Id.
    /// </summary>
    [HttpGet("holds")]
    [RequireStudentId]
    [ProducesResponseType(typeof(IReadOnlyList<StudentHoldResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetMyHolds(CancellationToken cancellationToken)
    {
        var studentId = (string)HttpContext.Items["StudentId"]!;
        var result = await _holdService.GetStudentHoldsAsync(studentId, cancellationToken);
        return Ok(result);
    }
}

