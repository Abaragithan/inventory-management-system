using System.Collections.Generic;

namespace InventoryManagementSystem.Models.DTOs.PurchaseRequest
{
    public class ReceivePurchaseRequestDto
    {
        public List<ReceivePurchaseRequestItemDto> Items { get; set; } = new();
    }
}
