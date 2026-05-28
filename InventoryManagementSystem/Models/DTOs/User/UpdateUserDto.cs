namespace InventoryManagementSystem.Models.DTOs.User;

public class UpdateUserDto
{
    public string Email { get; set; }
        = string.Empty;

    public string Role { get; set; }
        = string.Empty;

    public bool IsActive { get; set; }

    public bool IsEmailVerified { get; set; }
}