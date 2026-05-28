using InventoryManagementSystem.Models.Entities;

public class Product
{
    public int ProductId { get; set; }

    public string Barcode { get; set; }
        = string.Empty;

    public string Name { get; set; }
        = string.Empty;

    public string Description { get; set; }
        = string.Empty;

    public decimal Price { get; set; }

    public decimal CostPrice { get; set; }

    public int Quantity { get; set; }

    public int ReorderLevel { get; set; }

    // Foreign Keys
    public int CategoryId { get; set; }

    public int SupplierId { get; set; }

    public DateTime CreatedAt { get; set; }
        = DateTime.UtcNow;

    // Navigation Properties
    public Category Category { get; set; } = null!;

    public Supplier Supplier { get; set; } = null!;

    public ICollection<StockTransaction> StockTransactions
    { get; set; } = new List<StockTransaction>();
}