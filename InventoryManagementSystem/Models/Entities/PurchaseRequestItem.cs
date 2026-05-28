namespace InventoryManagementSystem.Models.Entities
{
    public class PurchaseRequestItem
    {
        public int RequestItemId { get; set; }

        public int RequestId { get; set; }

        public int ProductId { get; set; }

        public int RequestedQuantity { get; set; }

        public int? DeliveredQuantity { get; set; }

        public decimal UnitCost { get; set; }

        public string Notes { get; set; } = string.Empty;

        public bool IsReceived { get; set; }


        // Navigation Properties
        public PurchaseRequest PurchaseRequest { get; set; } = null!;

        public Product Product { get; set; } = null!;
    }
}