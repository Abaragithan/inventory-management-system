using FluentValidation;
using InventoryManagementSystem.Models.DTOs.Auth;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagementSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _service;
    private readonly IValidator<RegisterDto> _registerValidator;
    private readonly IValidator<LoginDto> _loginValidator;

    public AuthController(
        IAuthService service,
        IValidator<RegisterDto> registerValidator,
        IValidator<LoginDto> loginValidator)
    {
        _service = service;
        _registerValidator = registerValidator;
        _loginValidator = loginValidator;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var validation = await _registerValidator.ValidateAsync(dto);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => e.ErrorMessage);
            return BadRequest(new { message = string.Join("; ", errors) });
        }

        await _service.RegisterAsync(dto);

        return Ok(new
        {
            message = "Registered successfully. Please click the verification link sent to your email."
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var validation = await _loginValidator.ValidateAsync(dto);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => e.ErrorMessage);
            return BadRequest(new { message = string.Join("; ", errors) });
        }

        var result = await _service.LoginAsync(dto);

        return Ok(result);
    }

    [HttpGet("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token)
    {
        var email = await _service.VerifyEmailAsync(token);
        if (email == null)
        {
            return Content(@"
<html>
<head>
    <title>Verification Failed</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 100%; }
        h1 { color: #dc3545; margin-bottom: 20px; }
        p { color: #6c757d; font-size: 16px; line-height: 1.5; }
        .btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
    </style>
</head>
<body>
    <div class='card'>
        <h1>Verification Failed</h1>
        <p>The verification link is invalid or has expired.</p>
        <a href='http://localhost:4200/login' class='btn'>Go to Login</a>
    </div>
</body>
</html>", "text/html");
        }

        return Content(@"
<html>
<head>
    <title>Verification Successful</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px; width: 100%; }
        h1 { color: #198754; margin-bottom: 20px; }
        p { color: #6c757d; font-size: 16px; line-height: 1.5; }
        .btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
    </style>
</head>
<body>
    <div class='card'>
        <h1>Email Verified!</h1>
        <p>Your email has been successfully verified. You can now log in to your account.</p>
        <a href='http://localhost:4200/login' class='btn'>Go to Login</a>
    </div>
</body>
</html>", "text/html");
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto dto)
    {
        try
        {
            var result = await _service.RefreshTokenAsync(dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}