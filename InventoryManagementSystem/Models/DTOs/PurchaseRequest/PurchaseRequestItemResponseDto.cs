namespace InventoryManagementSystem.Models.DTOs.PurchaseRequest
{
    public class PurchaseRequestItemResponseDto
    {
        public int RequestItemId { get; set; }
        public int RequestId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductBarcode { get; set; } = string.Empty;
        public int RequestedQuantity { get; set; }
        public int? DeliveredQuantity { get; set; }
        public decimal UnitCost { get; set; }
        public string Notes { get; set; } = string.Empty;
        public bool IsReceived { get; set; }
    }
}
