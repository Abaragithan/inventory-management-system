namespace InventoryManagementSystem.Models.DTOs.PurchaseRequest
{
    public class CreatePurchaseRequestItemDto
    {
        public int ProductId { get; set; }
        public int RequestedQuantity { get; set; }
        public decimal UnitCost { get; set; }
        public string Notes { get; set; } = string.Empty;
    }
}
