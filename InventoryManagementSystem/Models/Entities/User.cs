using InventoryManagementSystem.Enums;

namespace InventoryManagementSystem.Models.Entities;

public class User
{
    public int UserId { get; set; }

    public string Email { get; set; }
        = string.Empty;

    public string PasswordHash { get; set; }
        = string.Empty;

    public UserRole Role { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsEmailVerified { get; set; } = false;

    public string? RefreshToken { get; set; }

    public DateTime? RefreshTokenExpiryTime { get; set; }

    public DateTime CreatedAt { get; set; }
        = DateTime.UtcNow;

    // Supplier Profile
    public Supplier? Supplier { get; set; }

    // Navigation Properties
    public ICollection<StockTransaction> StockTransactions
    { get; set; } = new List<StockTransaction>();
}