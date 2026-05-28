namespace InventoryManagementSystem.Models.DTOs.PurchaseRequest
{
    public class ReceivePurchaseRequestItemDto
    {
        public int RequestItemId { get; set; }
        public int DeliveredQuantity { get; set; }
        public string Notes { get; set; } = string.Empty;
    }
}
