using System.Security.Claims;
using InventoryManagementSystem.Data;
using InventoryManagementSystem.Models.DTOs.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagementSystem.Controllers;

/// <summary>
/// Profile endpoint accessible by Admin and InventoryManager roles.
/// Lets users view their own profile and change their own password.
/// </summary>
[Authorize(Roles = "Admin,InventoryManager")]
[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProfileController(AppDbContext context)
    {
        _context = context;
    }

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }

    /// <summary>GET /api/profile — Returns the calling user's own profile.</summary>
    [HttpGet]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(new { message = "User identity not found in token." });

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound(new { message = "User not found." });

        return Ok(new UserResponseDto
        {
            UserId = user.UserId,
            Email = user.Email,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }

    /// <summary>PUT /api/profile/change-password — Allows the calling user to change their own password.</summary>
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (dto.NewPassword != dto.ConfirmNewPassword)
            return BadRequest(new { message = "New passwords do not match." });

        if (dto.NewPassword.Length < 6)
            return BadRequest(new { message = "New password must be at least 6 characters." });

        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized(new { message = "User identity not found in token." });

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound(new { message = "User not found." });

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Current password is incorrect." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

