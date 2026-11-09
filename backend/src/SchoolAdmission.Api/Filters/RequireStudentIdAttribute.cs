using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace SchoolAdmission.Api.Filters;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequireStudentIdAttribute : ActionFilterAttribute
{
    public const string HeaderName = "X-Student-Id";
    private static readonly Regex StudentIdRegex = new(@"^\d{17}$", RegexOptions.Compiled);

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.HttpContext.Request.Headers.TryGetValue(HeaderName, out var headerValues) ||
            string.IsNullOrWhiteSpace(headerValues.FirstOrDefault()))
        {
            context.Result = new BadRequestObjectResult(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = $"Missing required {HeaderName} header.",
                Instance = context.HttpContext.Request.Path
            });
            return;
        }

        var studentId = headerValues.First()!.Trim();

        if (!StudentIdRegex.IsMatch(studentId))
        {
            context.Result = new BadRequestObjectResult(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = $"{HeaderName} must contain exactly 17 numeric digits.",
                Instance = context.HttpContext.Request.Path
            });
            return;
        }

        context.HttpContext.Items["StudentId"] = studentId;
        base.OnActionExecuting(context);
    }
}

