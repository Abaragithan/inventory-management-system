using System.Collections.Generic;

namespace InventoryManagementSystem.Models.DTOs.PurchaseRequest
{
    public class PurchaseRequestSuggestionDto
    {
        public int SupplierId { get; set; }
        public string SupplierCompanyName { get; set; } = string.Empty;
        public List<PurchaseRequestSuggestionItemDto> Items { get; set; } = new();
    }

    public class PurchaseRequestSuggestionItemDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductBarcode { get; set; } = string.Empty;
        public int CurrentQuantity { get; set; }
        public int ReorderLevel { get; set; }
        public int SuggestedQuantity { get; set; }
        public decimal UnitCost { get; set; }
    }
}
