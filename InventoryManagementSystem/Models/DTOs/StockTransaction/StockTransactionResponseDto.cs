using System;

namespace InventoryManagementSystem.Models.DTOs.StockTransaction
{
    public class StockTransactionResponseDto
    {
        public int TransactionId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
