using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.Filters;
using SchoolAdmission.Application.DTOs;
using SchoolAdmission.Application.Interfaces;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("holds")]
public class HoldsController : ControllerBase
{
    private readonly IHoldService _holdService;
    private readonly ILogger<HoldsController> _logger;

    public HoldsController(IHoldService holdService, ILogger<HoldsController> logger)
    {
        _holdService = holdService;
        _logger = logger;
    }

    /// <summary>
    /// Gets hold details and live status.
    /// </summary>
    [HttpGet("{holdId:guid}")]
    [ProducesResponseType(typeof(HoldResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHold([FromRoute] Guid holdId, CancellationToken cancellationToken)
    {
        var result = await _holdService.GetHoldByIdAsync(holdId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Confirms admission for a valid hold (simulated payment).
    /// </summary>
    [HttpPost("{holdId:guid}/confirm")]
    [RequireStudentId]
    [ProducesResponseType(typeof(ConfirmHoldResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ConfirmHold([FromRoute] Guid holdId, CancellationToken cancellationToken)
    {
        var studentId = (string)HttpContext.Items["StudentId"]!;
        var result = await _holdService.ConfirmHoldAsync(holdId, studentId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Cancels an active hold and releases the reserved seat.
    /// </summary>
    [HttpDelete("{holdId:guid}")]
    [RequireStudentId]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CancelHold([FromRoute] Guid holdId, CancellationToken cancellationToken)
    {
        var studentId = (string)HttpContext.Items["StudentId"]!;
        await _holdService.CancelHoldAsync(holdId, studentId, cancellationToken);
        return NoContent();
    }
}

