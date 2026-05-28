namespace InventoryManagementSystem.Models.DTOs.User;

public class UserResponseDto
{
    public int UserId { get; set; }

    public string Email { get; set; }
        = string.Empty;

    public string Role { get; set; }
        = string.Empty;

    public bool IsActive { get; set; }

    public bool IsEmailVerified { get; set; }

    public DateTime CreatedAt { get; set; }
}