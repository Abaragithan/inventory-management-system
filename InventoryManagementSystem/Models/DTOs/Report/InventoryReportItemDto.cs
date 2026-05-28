namespace InventoryManagementSystem.Models.DTOs.Report
{
    public class InventoryReportItemDto
    {
        public int ProductId { get; set; }
        public string Barcode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string SupplierName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal CostPrice { get; set; }
        public int Quantity { get; set; }
        public int ReorderLevel { get; set; }
        public decimal TotalValue => Quantity * Price;
        public decimal TotalCostValue => Quantity * CostPrice;
        public bool IsLowStock => Quantity <= ReorderLevel;
    }
}
