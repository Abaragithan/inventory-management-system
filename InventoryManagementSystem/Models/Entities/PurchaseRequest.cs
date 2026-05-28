using InventoryManagementSystem.Enums;

namespace InventoryManagementSystem.Models.Entities
{
    public class PurchaseRequest
    {
        public int RequestId { get; set; }

        public int SupplierId { get; set; }

        public int RequestedByUserId { get; set; }

        public string RequestNumber { get; set; } = string.Empty;

        public RequestStatus RequestStatus { get; set; }

        public string Notes { get; set; } = string.Empty;

        public DateTime RequestedDate { get; set; } = DateTime.UtcNow;

        public DateTime? ExpectedDeliveryDate { get; set; }

        public DateTime? DeliveredDate { get; set; }

        public bool IsActive { get; set; } = true;


        // Navigation Properties
        public Supplier Supplier { get; set; } = null!;

        public User RequestedByUser { get; set; } = null!;

        public ICollection<PurchaseRequestItem> PurchaseRequestItems { get; set; }
            = new List<PurchaseRequestItem>();
    }
}