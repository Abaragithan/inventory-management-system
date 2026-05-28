using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagementSystem.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        HttpStatusCode statusCode;
        string message;

        switch (exception)
        {
            // Database constraint violations (FK, unique index, etc.)
            case DbUpdateException dbEx:
                statusCode = HttpStatusCode.Conflict;
                message = ParseDbUpdateException(dbEx);
                break;

            case UnauthorizedAccessException:
                statusCode = HttpStatusCode.Unauthorized;
                message = exception.Message;
                break;

            case KeyNotFoundException:
                statusCode = HttpStatusCode.NotFound;
                message = exception.Message;
                break;

            case InvalidOperationException:
                statusCode = HttpStatusCode.Conflict;
                message = exception.Message;
                break;

            case ArgumentException:
                statusCode = HttpStatusCode.BadRequest;
                message = exception.Message;
                break;

            default:
                // Treat concise exception messages as business logic errors (400)
                var msg = exception.Message;
                if (!string.IsNullOrEmpty(msg) && msg.Length < 300)
                {
                    statusCode = HttpStatusCode.BadRequest;
                    message = msg;
                }
                else
                {
                    statusCode = HttpStatusCode.InternalServerError;
                    message = "An unexpected error occurred. Please try again later.";
                }
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            message,
            statusCode = (int)statusCode
        };

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        return context.Response.WriteAsync(json);
    }

    /// <summary>
    /// Parses a DbUpdateException to extract a user-friendly error message
    /// from the underlying database provider error (FK violations, unique constraints, etc.).
    /// </summary>
    private static string ParseDbUpdateException(DbUpdateException dbEx)
    {
        var innerMessage = dbEx.InnerException?.Message ?? dbEx.Message;

        // SQL Server FK constraint violation
        if (innerMessage.Contains("FOREIGN KEY constraint", StringComparison.OrdinalIgnoreCase)
            || innerMessage.Contains("REFERENCE constraint", StringComparison.OrdinalIgnoreCase))
        {
            return "Cannot complete this operation because the record is referenced by other data. " +
                   "Please remove or reassign the dependent records first.";
        }

        // SQL Server unique constraint / unique index violation
        if (innerMessage.Contains("UNIQUE constraint", StringComparison.OrdinalIgnoreCase)
            || innerMessage.Contains("duplicate key", StringComparison.OrdinalIgnoreCase)
            || innerMessage.Contains("Cannot insert duplicate key", StringComparison.OrdinalIgnoreCase))
        {
            return "A record with the same unique value already exists. Please use a different value.";
        }

        // Fallback for other DB errors
        return "A database error occurred while processing your request. Please try again.";
    }
}
