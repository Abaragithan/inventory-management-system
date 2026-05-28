using InventoryManagementSystem.Enums;

namespace InventoryManagementSystem.Models.DTOs.StockTransaction
{
    public class CreateStockTransactionDto
    {
        public int ProductId { get; set; }
        public StockTransactionType Type { get; set; }
        public int Quantity { get; set; }
        public string? Notes { get; set; }
    }
}
