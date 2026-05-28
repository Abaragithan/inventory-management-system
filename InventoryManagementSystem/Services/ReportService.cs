using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using InventoryManagementSystem.Data;
using InventoryManagementSystem.Enums;
using InventoryManagementSystem.Models.DTOs.Report;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagementSystem.Services
{
    public class ReportService : IReportService
    {
        private readonly AppDbContext _context;

        public ReportService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<InventoryReportItemDto>> GetInventoryReportAsync(
            int? categoryId,
            int? supplierId,
            string? status)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Supplier)
                .AsNoTracking()
                .AsQueryable();

            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            if (supplierId.HasValue)
            {
                query = query.Where(p => p.SupplierId == supplierId.Value);
            }

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                if (status.Equals("LowStock", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(p => p.Quantity <= p.ReorderLevel);
                }
                else if (status.Equals("OutOfStock", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(p => p.Quantity == 0);
                }
                else if (status.Equals("Normal", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(p => p.Quantity > p.ReorderLevel);
                }
            }

            return await query
                .Select(p => new InventoryReportItemDto
                {
                    ProductId = p.ProductId,
                    Barcode = p.Barcode,
                    ProductName = p.Name,
                    CategoryName = p.Category.Name,
                    SupplierName = p.Supplier.CompanyName,
                    Price = p.Price,
                    CostPrice = p.CostPrice,
                    Quantity = p.Quantity,
                    ReorderLevel = p.ReorderLevel
                })
                .OrderBy(p => p.ProductName)
                .ToListAsync();
        }

        public async Task<List<TransactionReportItemDto>> GetTransactionReportAsync(
            int? productId,
            string? type,
            DateTime? startDate,
            DateTime? endDate)
        {
            var query = _context.StockTransactions
                .Include(st => st.Product)
                .Include(st => st.User)
                .AsNoTracking()
                .AsQueryable();

            if (productId.HasValue)
            {
                query = query.Where(st => st.ProductId == productId.Value);
            }

            if (!string.IsNullOrWhiteSpace(type) && !type.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                if (Enum.TryParse<StockTransactionType>(type, true, out var transactionType))
                {
                    query = query.Where(st => st.Type == transactionType);
                }
            }

            if (startDate.HasValue)
            {
                // Ensure date boundaries are correct
                query = query.Where(st => st.CreatedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(st => st.CreatedAt <= endDate.Value);
            }

            return await query
                .Select(st => new TransactionReportItemDto
                {
                    TransactionId = st.TransactionId,
                    ProductId = st.ProductId,
                    ProductBarcode = st.Product.Barcode,
                    ProductName = st.Product.Name,
                    Type = st.Type.ToString(),
                    Quantity = st.Quantity,
                    UserEmail = st.User.Email,
                    Notes = st.Notes,
                    CreatedAt = st.CreatedAt
                })
                .OrderByDescending(st => st.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<PurchaseRequestReportItemDto>> GetPurchaseRequestReportAsync(
            int? supplierId,
            string? status,
            DateTime? startDate,
            DateTime? endDate)
        {
            var query = _context.PurchaseRequests
                .Include(pr => pr.Supplier)
                .Include(pr => pr.RequestedByUser)
                .Include(pr => pr.PurchaseRequestItems)
                .AsNoTracking()
                .AsQueryable();

            if (supplierId.HasValue)
            {
                query = query.Where(pr => pr.SupplierId == supplierId.Value);
            }

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                if (Enum.TryParse<RequestStatus>(status, true, out var requestStatus))
                {
                    query = query.Where(pr => pr.RequestStatus == requestStatus);
                }
            }

            if (startDate.HasValue)
            {
                query = query.Where(pr => pr.RequestedDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(pr => pr.RequestedDate <= endDate.Value);
            }

            return await query
                .Select(pr => new PurchaseRequestReportItemDto
                {
                    RequestId = pr.RequestId,
                    RequestNumber = pr.RequestNumber,
                    RequestedByUserEmail = pr.RequestedByUser.Email,
                    SupplierCompanyName = pr.Supplier.CompanyName,
                    Status = pr.RequestStatus.ToString(),
                    RequestedDate = pr.RequestedDate,
                    ExpectedDeliveryDate = pr.ExpectedDeliveryDate,
                    DeliveredDate = pr.DeliveredDate,
                    ItemCount = pr.PurchaseRequestItems.Count,
                    TotalCost = pr.PurchaseRequestItems.Sum(item => item.RequestedQuantity * item.UnitCost),
                    Notes = pr.Notes
                })
                .OrderByDescending(pr => pr.RequestedDate)
                .ToListAsync();
        }
    }
}
