using System;
using System.Collections.Generic;
using InventoryManagementSystem.Enums;

namespace InventoryManagementSystem.Models.DTOs.PurchaseRequest
{
    public class PurchaseRequestResponseDto
    {
        public int RequestId { get; set; }
        public int SupplierId { get; set; }
        public string SupplierCompanyName { get; set; } = string.Empty;
        public int RequestedByUserId { get; set; }
        public string RequestedByUserEmail { get; set; } = string.Empty;
        public string RequestNumber { get; set; } = string.Empty;
        public RequestStatus RequestStatus { get; set; }
        public string Notes { get; set; } = string.Empty;
        public DateTime RequestedDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? DeliveredDate { get; set; }
        public bool IsActive { get; set; }
        public List<PurchaseRequestItemResponseDto> PurchaseRequestItems { get; set; } = new();
    }
}
