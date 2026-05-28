using InventoryManagementSystem.Enums;

namespace InventoryManagementSystem.Models.DTOs.PurchaseRequest
{
    public class UpdatePurchaseRequestStatusDto
    {
        public RequestStatus RequestStatus { get; set; }
        public string Notes { get; set; } = string.Empty;
    }
}
