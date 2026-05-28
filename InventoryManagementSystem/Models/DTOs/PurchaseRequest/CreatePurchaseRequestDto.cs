using System;
using System.Collections.Generic;

namespace InventoryManagementSystem.Models.DTOs.PurchaseRequest
{
    public class CreatePurchaseRequestDto
    {
        public int SupplierId { get; set; }
        public string Notes { get; set; } = string.Empty;
        public DateTime? ExpectedDeliveryDate { get; set; }
        public List<CreatePurchaseRequestItemDto> PurchaseRequestItems { get; set; } = new();
    }
}
