using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using InventoryManagementSystem.Models.DTOs.Report;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagementSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;
        private readonly ISupplierService _supplierService;

        public ReportsController(
            IReportService reportService,
            ISupplierService supplierService)
        {
            _reportService = reportService;
            _supplierService = supplierService;
        }

        private async Task<int?> GetSupplierIdIfSupplierRole()
        {
            if (User.IsInRole("Supplier"))
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var userId))
                {
                    var supplierProfile = await _supplierService.GetByUserIdAsync(userId);
                    return supplierProfile?.SupplierId;
                }
            }
            return null;
        }

        [Authorize(Roles = "Admin,InventoryManager,Supplier")]
        [HttpGet("inventory")]
        public async Task<IActionResult> GetInventoryReport(
            [FromQuery] int? categoryId,
            [FromQuery] int? supplierId,
            [FromQuery] string? status)
        {
            var forcedSupplierId = await GetSupplierIdIfSupplierRole();
            if (User.IsInRole("Supplier"))
            {
                if (forcedSupplierId == null)
                {
                    return Forbid("Supplier profile not found.");
                }
                supplierId = forcedSupplierId;
            }

            var data = await _reportService.GetInventoryReportAsync(categoryId, supplierId, status);
            return Ok(data);
        }

        [Authorize(Roles = "Admin,InventoryManager,Supplier")]
        [HttpGet("inventory/export")]
        public async Task<IActionResult> ExportInventoryReport(
            [FromQuery] int? categoryId,
            [FromQuery] int? supplierId,
            [FromQuery] string? status)
        {
            var forcedSupplierId = await GetSupplierIdIfSupplierRole();
            if (User.IsInRole("Supplier"))
            {
                if (forcedSupplierId == null)
                {
                    return Forbid("Supplier profile not found.");
                }
                supplierId = forcedSupplierId;
            }

            var data = await _reportService.GetInventoryReportAsync(categoryId, supplierId, status);

            var sb = new StringBuilder();
            sb.AppendLine("Barcode,Product Name,Category,Supplier,Price,Cost Price,Quantity,Reorder Level,Total Valuation (Price),Total Cost Valuation,Is Low Stock");

            foreach (var item in data)
            {
                sb.AppendLine($"{EscapeCsv(item.Barcode)},{EscapeCsv(item.ProductName)},{EscapeCsv(item.CategoryName)},{EscapeCsv(item.SupplierName)},{item.Price},{item.CostPrice},{item.Quantity},{item.ReorderLevel},{item.TotalValue},{item.TotalCostValue},{(item.IsLowStock ? "Yes" : "No")}");
            }

            return FileToCsvResponse(sb.ToString(), "Inventory_Status_Report");
        }

        [Authorize(Roles = "Admin,InventoryManager")]
        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactionReport(
            [FromQuery] int? productId,
            [FromQuery] string? type,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var data = await _reportService.GetTransactionReportAsync(productId, type, startDate, endDate);
            return Ok(data);
        }

        [Authorize(Roles = "Admin,InventoryManager")]
        [HttpGet("transactions/export")]
        public async Task<IActionResult> ExportTransactionReport(
            [FromQuery] int? productId,
            [FromQuery] string? type,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var data = await _reportService.GetTransactionReportAsync(productId, type, startDate, endDate);

            var sb = new StringBuilder();
            sb.AppendLine("Transaction ID,Timestamp,Barcode,Product Name,Type,Quantity,Recorded By,Notes");

            foreach (var item in data)
            {
                sb.AppendLine($"{item.TransactionId},{item.CreatedAt:yyyy-MM-dd HH:mm:ss},{EscapeCsv(item.ProductBarcode)},{EscapeCsv(item.ProductName)},{item.Type},{item.Quantity},{EscapeCsv(item.UserEmail)},{EscapeCsv(item.Notes)}");
            }

            return FileToCsvResponse(sb.ToString(), "Stock_Transactions_Report");
        }

        [Authorize(Roles = "Admin,InventoryManager,Supplier")]
        [HttpGet("purchase-requests")]
        public async Task<IActionResult> GetPurchaseRequestReport(
            [FromQuery] int? supplierId,
            [FromQuery] string? status,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var forcedSupplierId = await GetSupplierIdIfSupplierRole();
            if (User.IsInRole("Supplier"))
            {
                if (forcedSupplierId == null)
                {
                    return Forbid("Supplier profile not found.");
                }
                supplierId = forcedSupplierId;
            }

            var data = await _reportService.GetPurchaseRequestReportAsync(supplierId, status, startDate, endDate);
            return Ok(data);
        }

        [Authorize(Roles = "Admin,InventoryManager,Supplier")]
        [HttpGet("purchase-requests/export")]
        public async Task<IActionResult> ExportPurchaseRequestReport(
            [FromQuery] int? supplierId,
            [FromQuery] string? status,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var forcedSupplierId = await GetSupplierIdIfSupplierRole();
            if (User.IsInRole("Supplier"))
            {
                if (forcedSupplierId == null)
                {
                    return Forbid("Supplier profile not found.");
                }
                supplierId = forcedSupplierId;
            }

            var data = await _reportService.GetPurchaseRequestReportAsync(supplierId, status, startDate, endDate);

            var sb = new StringBuilder();
            sb.AppendLine("Request Number,Requested By,Supplier,Status,Requested Date,Expected Delivery Date,Delivered Date,Item Count,Total Cost,Notes");

            foreach (var item in data)
            {
                var reqDate = item.RequestedDate.ToString("yyyy-MM-dd HH:mm:ss");
                var expDelDate = item.ExpectedDeliveryDate?.ToString("yyyy-MM-dd") ?? "N/A";
                var delDate = item.DeliveredDate?.ToString("yyyy-MM-dd HH:mm:ss") ?? "N/A";

                sb.AppendLine($"{EscapeCsv(item.RequestNumber)},{EscapeCsv(item.RequestedByUserEmail)},{EscapeCsv(item.SupplierCompanyName)},{item.Status},{reqDate},{expDelDate},{delDate},{item.ItemCount},{item.TotalCost},{EscapeCsv(item.Notes)}");
            }

            return FileToCsvResponse(sb.ToString(), "Purchase_Requests_Report");
        }

        private string EscapeCsv(string? val)
        {
            if (string.IsNullOrEmpty(val)) return string.Empty;
            if (val.Contains(",") || val.Contains("\"") || val.Contains("\n") || val.Contains("\r"))
            {
                return $"\"{val.Replace("\"", "\"\"")}\"";
            }
            return val;
        }

        private IActionResult FileToCsvResponse(string csvContent, string baseFileName)
        {
            var fileName = $"{baseFileName}_{DateTime.Now:yyyyMMdd_HHmmss}.csv";
            var bom = new byte[] { 0xEF, 0xBB, 0xBF }; // UTF-8 BOM for Excel
            var contentBytes = Encoding.UTF8.GetBytes(csvContent);
            var fileBytes = bom.Concat(contentBytes).ToArray();
            return File(fileBytes, "text/csv; charset=utf-8", fileName);
        }
    }
}
