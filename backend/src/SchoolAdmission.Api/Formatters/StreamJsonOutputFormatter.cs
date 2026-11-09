using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Formatters;

namespace SchoolAdmission.Api.Formatters;

public class StreamJsonOutputFormatter : TextOutputFormatter
{
    private readonly JsonSerializerOptions _jsonSerializerOptions;

    public StreamJsonOutputFormatter(JsonSerializerOptions jsonSerializerOptions)
    {
        _jsonSerializerOptions = jsonSerializerOptions;
        SupportedMediaTypes.Add("application/json");
        SupportedMediaTypes.Add("text/json");
        SupportedMediaTypes.Add("application/problem+json");
        SupportedEncodings.Add(Encoding.UTF8);
    }

    public override async Task WriteResponseBodyAsync(OutputFormatterWriteContext context, Encoding selectedEncoding)
    {
        var response = context.HttpContext.Response;
        var value = context.Object;
        var objectType = context.ObjectType ?? value?.GetType() ?? typeof(object);

        await JsonSerializer.SerializeAsync(response.Body, value, objectType, _jsonSerializerOptions);
    }
}

