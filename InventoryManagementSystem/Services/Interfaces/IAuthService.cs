using InventoryManagementSystem.Models.DTOs.Auth;

namespace InventoryManagementSystem.Services.Interfaces;

public interface IAuthService
{
    Task RegisterAsync(RegisterDto dto);

    Task<AuthResponseDto> LoginAsync(LoginDto dto);

    Task<string?> VerifyEmailAsync(string token);

    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto);
}