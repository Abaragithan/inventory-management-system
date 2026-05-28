using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InventoryManagementSystem.Models.DTOs.Report;

namespace InventoryManagementSystem.Services.Interfaces
{
    public interface IReportService
    {
        Task<List<InventoryReportItemDto>> GetInventoryReportAsync(
            int? categoryId,
            int? supplierId,
            string? status);

        Task<List<TransactionReportItemDto>> GetTransactionReportAsync(
            int? productId,
            string? type,
            DateTime? startDate,
            DateTime? endDate);

        Task<List<PurchaseRequestReportItemDto>> GetPurchaseRequestReportAsync(
            int? supplierId,
            string? status,
            DateTime? startDate,
            DateTime? endDate);
    }
}
