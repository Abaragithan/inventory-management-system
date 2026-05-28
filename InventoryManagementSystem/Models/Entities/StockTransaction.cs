using InventoryManagementSystem.Enums;

namespace InventoryManagementSystem.Models.Entities;

public class StockTransaction
{
    public int TransactionId { get; set; }

    // Foreign Keys
    public int ProductId { get; set; }

    public int UserId { get; set; }

    public StockTransactionType Type { get; set; }

    public int Quantity { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }
        = DateTime.UtcNow;

    // Navigation Properties
    public Product Product { get; set; } = null!;

    public User User { get; set; } = null!;
}