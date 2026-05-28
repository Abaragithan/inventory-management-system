using System;

namespace InventoryManagementSystem.Models.DTOs.Report
{
    public class PurchaseRequestReportItemDto
    {
        public int RequestId { get; set; }
        public string RequestNumber { get; set; } = string.Empty;
        public string RequestedByUserEmail { get; set; } = string.Empty;
        public string SupplierCompanyName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime RequestedDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? DeliveredDate { get; set; }
        public int ItemCount { get; set; }
        public decimal TotalCost { get; set; }
        public string Notes { get; set; } = string.Empty;
    }
}
