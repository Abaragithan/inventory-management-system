using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using InventoryManagementSystem.Data;
using InventoryManagementSystem.Enums;
using InventoryManagementSystem.Models.DTOs.Dashboard;
using InventoryManagementSystem.Models.DTOs.Product;
using InventoryManagementSystem.Models.DTOs.PurchaseRequest;
using InventoryManagementSystem.Models.DTOs.StockTransaction;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagementSystem.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public DashboardService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(System.DateTime? startDate = null, System.DateTime? endDate = null)
        {
            var totalProducts = await _context.Products.CountAsync();
            var lowStockCount = await _context.Products.CountAsync(p => p.Quantity <= p.ReorderLevel);
            var activeSuppliers = await _context.Suppliers.CountAsync(s => s.User.IsActive);

            var transactionsQuery = _context.StockTransactions.AsQueryable();
            if (startDate.HasValue)
            {
                transactionsQuery = transactionsQuery.Where(t => t.CreatedAt >= startDate.Value);
            }
            if (endDate.HasValue)
            {
                transactionsQuery = transactionsQuery.Where(t => t.CreatedAt <= endDate.Value);
            }

            var recentTransactions = await transactionsQuery
                .Include(t => t.Product)
                .Include(t => t.User)
                .OrderByDescending(t => t.CreatedAt)
                .Take(20)   // Increased from 5 — chart slices to 7 points; more data = better Y-axis scale
                .AsNoTracking()
                .ToListAsync();

            var lowStockProducts = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Supplier)
                .Where(p => p.Quantity <= p.ReorderLevel)
                .OrderBy(p => p.Quantity)
                .Take(5)
                .AsNoTracking()
                .ToListAsync();

            // Counts per type in the filtered range
            var typeCounts = await transactionsQuery
                .GroupBy(t => t.Type)
                .Select(g => new { Type = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            var transactionTypeCounts = new Dictionary<string, int>
            {
                { "StockIn", 0 },
                { "StockOut", 0 },
                { "Adjustment", 0 },
                { "Return", 0 }
            };
            foreach (var tc in typeCounts)
            {
                if (transactionTypeCounts.ContainsKey(tc.Type))
                    transactionTypeCounts[tc.Type] = tc.Count;
            }

            return new DashboardSummaryDto
            {
                TotalProducts = totalProducts,
                LowStockAlertItems = lowStockCount,
                ActiveSuppliers = activeSuppliers,
                RecentTransactions = _mapper.Map<List<StockTransactionResponseDto>>(recentTransactions),
                LowStockWarningProducts = _mapper.Map<List<ProductListDto>>(lowStockProducts),
                TransactionTypeCounts = transactionTypeCounts
            };
        }


        public async Task<SupplierDashboardSummaryDto> GetSupplierDashboardSummaryAsync(int supplierId, System.DateTime? startDate = null, System.DateTime? endDate = null)
        {
            var totalProducts = await _context.Products.CountAsync(p => p.SupplierId == supplierId);
            var lowStockCount = await _context.Products.CountAsync(p => p.SupplierId == supplierId && p.Quantity <= p.ReorderLevel);

            var ordersQuery = _context.PurchaseRequests.Where(pr => pr.SupplierId == supplierId);
            if (startDate.HasValue)
            {
                ordersQuery = ordersQuery.Where(pr => pr.RequestedDate >= startDate.Value);
            }
            if (endDate.HasValue)
            {
                ordersQuery = ordersQuery.Where(pr => pr.RequestedDate <= endDate.Value);
            }

            var totalOrders = await ordersQuery.CountAsync();
            var pendingOrders = await ordersQuery.CountAsync(pr => pr.RequestStatus == RequestStatus.Pending);
            var deliveredOrders = await ordersQuery.CountAsync(pr => pr.RequestStatus == RequestStatus.Delivered);

            var recentOrders = await ordersQuery
                .Include(pr => pr.Supplier)
                .Include(pr => pr.RequestedByUser)
                .Include(pr => pr.PurchaseRequestItems)
                    .ThenInclude(pri => pri.Product)
                .OrderByDescending(pr => pr.RequestedDate)
                .Take(5)
                .AsNoTracking()
                .ToListAsync();

            var lowStockProducts = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Supplier)
                .Where(p => p.SupplierId == supplierId && p.Quantity <= p.ReorderLevel)
                .OrderBy(p => p.Quantity)
                .Take(5)
                .AsNoTracking()
                .ToListAsync();

            return new SupplierDashboardSummaryDto
            {
                TotalProducts = totalProducts,
                TotalOrders = totalOrders,
                PendingOrders = pendingOrders,
                DeliveredOrders = deliveredOrders,
                RecentOrders = _mapper.Map<List<PurchaseRequestResponseDto>>(recentOrders),
                LowStockProducts = _mapper.Map<List<ProductListDto>>(lowStockProducts)
            };
        }
    }
}
