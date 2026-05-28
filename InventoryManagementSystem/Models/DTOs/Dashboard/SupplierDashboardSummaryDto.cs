using System.Collections.Generic;
using InventoryManagementSystem.Models.DTOs.Product;
using InventoryManagementSystem.Models.DTOs.PurchaseRequest;

namespace InventoryManagementSystem.Models.DTOs.Dashboard
{
    public class SupplierDashboardSummaryDto
    {
        public int TotalProducts { get; set; }
        public int TotalOrders { get; set; }
        public int PendingOrders { get; set; }
        public int DeliveredOrders { get; set; }
        public List<PurchaseRequestResponseDto> RecentOrders { get; set; } = new List<PurchaseRequestResponseDto>();
        public List<ProductListDto> LowStockProducts { get; set; } = new List<ProductListDto>();
    }
}
