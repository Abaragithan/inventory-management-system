using InventoryManagementSystem.Data;
using InventoryManagementSystem.Enums;
using InventoryManagementSystem.Helpers;
using InventoryManagementSystem.Models.DTOs.Auth;
using InventoryManagementSystem.Models.Entities;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagementSystem.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly JwtTokenGenerator _jwt;
    private readonly IEmailService _emailService;

    public AuthService(
        AppDbContext context,
        JwtTokenGenerator jwtGenerator,
        IEmailService emailService)
    {
        _context = context;
        _jwt = jwtGenerator;
        _emailService = emailService;
    }

    public async Task RegisterAsync(RegisterDto dto)
    {
        var exists = await _context.Users
            .AnyAsync(x => x.Email == dto.Email);

        if (exists)
            throw new Exception("Email already exists");

        if (dto.Password != dto.ConfirmPassword)
            throw new Exception("Passwords do not match");

        var user = new User
        {
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = UserRole.Staff,
            IsEmailVerified = false
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _jwt.GenerateEmailVerificationToken(user.Email);
        var verificationLink = $"http://localhost:5053/api/auth/verify-email?token={Uri.EscapeDataString(token)}";
        await _emailService.SendEmailVerificationAsync(user.Email, verificationLink);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(
                x => x.Email == dto.Email);

        if (user == null)
            throw new Exception("Invalid email");

        if (!user.IsEmailVerified)
            throw new Exception("Email not verified. Please check your inbox for the verification link.");

        bool verified =
            BCrypt.Net.BCrypt.Verify(
                dto.Password,
                user.PasswordHash);

        if (!verified)
            throw new Exception("Invalid password");

        var token = _jwt.GenerateToken(user);
        var refreshToken = _jwt.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Email = user.Email,
            Role = user.Role.ToString()
        };
    }

    public async Task<string?> VerifyEmailAsync(string token)
    {
        var email = _jwt.ValidateEmailVerificationToken(token);
        if (email == null)
            return null;

        var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == email);
        if (user == null)
            return null;

        user.IsEmailVerified = true;
        await _context.SaveChangesAsync();

        return email;
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto)
    {
        var principal = _jwt.GetPrincipalFromExpiredToken(dto.AccessToken);
        var email = principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

        if (string.IsNullOrEmpty(email))
        {
            throw new Exception("Invalid token claims");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || user.RefreshToken != dto.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            throw new Exception("Invalid refresh token request");
        }

        var newAccessToken = _jwt.GenerateToken(user);
        var newRefreshToken = _jwt.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            Token = newAccessToken,
            RefreshToken = newRefreshToken,
            Email = user.Email,
            Role = user.Role.ToString()
        };
    }
}