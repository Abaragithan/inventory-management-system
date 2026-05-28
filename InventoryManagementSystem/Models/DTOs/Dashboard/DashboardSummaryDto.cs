using System.Collections.Generic;
using InventoryManagementSystem.Models.DTOs.Product;
using InventoryManagementSystem.Models.DTOs.StockTransaction;

namespace InventoryManagementSystem.Models.DTOs.Dashboard
{
    public class DashboardSummaryDto
    {
        public int TotalProducts { get; set; }
        public int LowStockAlertItems { get; set; }
        public int ActiveSuppliers { get; set; }
        public List<StockTransactionResponseDto> RecentTransactions { get; set; } = new List<StockTransactionResponseDto>();
        public List<ProductListDto> LowStockWarningProducts { get; set; } = new List<ProductListDto>();
        /// <summary>All-time transaction counts by type for the doughnut chart.</summary>
        public Dictionary<string, int> TransactionTypeCounts { get; set; } = new Dictionary<string, int>();
    }
}
