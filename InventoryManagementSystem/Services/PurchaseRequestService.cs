using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using InventoryManagementSystem.Data;
using InventoryManagementSystem.Enums;
using InventoryManagementSystem.Models.DTOs.PurchaseRequest;
using InventoryManagementSystem.Models.DTOs.StockTransaction;
using InventoryManagementSystem.Models.DTOs.Shared;
using InventoryManagementSystem.Models.Entities;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagementSystem.Services
{
    public class PurchaseRequestService : IPurchaseRequestService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IStockTransactionService _stockTransactionService;
        private readonly IEmailService _emailService;

        public PurchaseRequestService(
            AppDbContext context,
            IMapper mapper,
            IStockTransactionService stockTransactionService,
            IEmailService emailService)
        {
            _context = context;
            _mapper = mapper;
            _stockTransactionService = stockTransactionService;
            _emailService = emailService;
        }

        public async Task<IEnumerable<PurchaseRequestResponseDto>> GetAllAsync()
        {
            var requests = await _context.PurchaseRequests
                .Include(pr => pr.Supplier)
                .Include(pr => pr.RequestedByUser)
                .Include(pr => pr.PurchaseRequestItems)
                    .ThenInclude(pri => pri.Product)
                .AsNoTracking()
                .OrderByDescending(pr => pr.RequestedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<PurchaseRequestResponseDto>>(requests);
        }

        public async Task<PagedResult<PurchaseRequestResponseDto>> GetPagedAsync(
            string? search,
            string? status,
            int? supplierId,
            int page,
            int pageSize)
        {
            var query = _context.PurchaseRequests
                .Include(pr => pr.Supplier)
                .Include(pr => pr.RequestedByUser)
                .Include(pr => pr.PurchaseRequestItems)
                    .ThenInclude(pri => pri.Product)
                .AsNoTracking()
                .AsQueryable();

            if (supplierId.HasValue)
            {
                query = query.Where(pr => pr.SupplierId == supplierId.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(pr => 
                    pr.RequestNumber.ToLower().Contains(s) || 
                    pr.Supplier.CompanyName.ToLower().Contains(s) || 
                    (pr.Notes != null && pr.Notes.ToLower().Contains(s)));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                if (Enum.TryParse<RequestStatus>(status, out var statusEnum))
                {
                    query = query.Where(pr => pr.RequestStatus == statusEnum);
                }
                else
                {
                    query = query.Where(pr => false);
                }
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(pr => pr.RequestedDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var totalDbQuery = _context.PurchaseRequests.AsQueryable();
            if (supplierId.HasValue)
            {
                totalDbQuery = totalDbQuery.Where(pr => pr.SupplierId == supplierId.Value);
            }
            var totalDbCount = await totalDbQuery.CountAsync();
            var pendingCount = await totalDbQuery.CountAsync(pr => pr.RequestStatus == RequestStatus.Pending);
            var acceptedCount = await totalDbQuery.CountAsync(pr => pr.RequestStatus == RequestStatus.Accepted);
            var deliveredCount = await totalDbQuery.CountAsync(pr => pr.RequestStatus == RequestStatus.Delivered);

            return new PagedResult<PurchaseRequestResponseDto>
            {
                Items = _mapper.Map<IEnumerable<PurchaseRequestResponseDto>>(items),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                Summary = new Dictionary<string, int>
                {
                    { "totalCount", totalDbCount },
                    { "pendingCount", pendingCount },
                    { "acceptedCount", acceptedCount },
                    { "deliveredCount", deliveredCount }
                }
            };
        }

        public async Task<IEnumerable<PurchaseRequestResponseDto>> GetBySupplierIdAsync(int supplierId)
        {
            var requests = await _context.PurchaseRequests
                .Include(pr => pr.Supplier)
                .Include(pr => pr.RequestedByUser)
                .Include(pr => pr.PurchaseRequestItems)
                    .ThenInclude(pri => pri.Product)
                .Where(pr => pr.SupplierId == supplierId)
                .AsNoTracking()
                .OrderByDescending(pr => pr.RequestedDate)
                .ToListAsync();

            return _mapper.Map<IEnumerable<PurchaseRequestResponseDto>>(requests);
        }

        public async Task<PurchaseRequestResponseDto?> GetByIdAsync(int id)
        {
            var request = await _context.PurchaseRequests
                .Include(pr => pr.Supplier)
                .Include(pr => pr.RequestedByUser)
                .Include(pr => pr.PurchaseRequestItems)
                    .ThenInclude(pri => pri.Product)
                .AsNoTracking()
                .FirstOrDefaultAsync(pr => pr.RequestId == id);

            if (request == null) return null;

            return _mapper.Map<PurchaseRequestResponseDto>(request);
        }

        public async Task<PurchaseRequestResponseDto> CreateAsync(CreatePurchaseRequestDto dto, int requestedByUserId)
        {
            var supplierExists = await _context.Suppliers.AnyAsync(s => s.SupplierId == dto.SupplierId && s.User.IsActive);
            if (!supplierExists)
            {
                throw new Exception("Active supplier not found.");
            }

            var request = _mapper.Map<PurchaseRequest>(dto);
            request.RequestedByUserId = requestedByUserId;
            request.RequestStatus = RequestStatus.Pending;
            request.RequestedDate = DateTime.UtcNow;
            request.IsActive = true;

            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            request.RequestNumber = $"PR-{timestamp}";

            foreach (var item in request.PurchaseRequestItems)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product == null)
                {
                    throw new Exception($"Product with ID {item.ProductId} not found.");
                }
                item.IsReceived = false;
                item.DeliveredQuantity = null;
            }

            _context.PurchaseRequests.Add(request);
            await _context.SaveChangesAsync();

            // Load properties for returning DTO
            await _context.Entry(request).Reference(pr => pr.Supplier).LoadAsync();
            await _context.Entry(request).Reference(pr => pr.RequestedByUser).LoadAsync();
            foreach (var item in request.PurchaseRequestItems)
            {
                await _context.Entry(item).Reference(pri => pri.Product).LoadAsync();
            }

            // Trigger Email to Supplier
            if (request.Supplier != null && !string.IsNullOrEmpty(request.Supplier.Email))
            {
                try
                {
                    await _emailService.SendPurchaseRequestCreatedAsync(
                        request.Supplier.Email,
                        request.Supplier.CompanyName,
                        request.RequestNumber);
                }
                catch
                {
                    // Ignore email sending error to keep app transactional integrity
                }
            }

            return _mapper.Map<PurchaseRequestResponseDto>(request);
        }

        public async Task<bool> UpdateStatusAsync(int id, UpdatePurchaseRequestStatusDto dto, int? supplierIdFilter = null)
        {
            var request = await _context.PurchaseRequests
                .Include(pr => pr.RequestedByUser)
                .FirstOrDefaultAsync(pr => pr.RequestId == id);

            if (request == null) return false;

            if (supplierIdFilter.HasValue && request.SupplierId != supplierIdFilter.Value)
            {
                throw new Exception("Unauthorized to modify this purchase request.");
            }

            if (request.RequestStatus != RequestStatus.Pending)
            {
                throw new Exception("Only pending purchase requests can have their status changed.");
            }

            if (dto.RequestStatus != RequestStatus.Accepted && dto.RequestStatus != RequestStatus.Rejected)
            {
                throw new Exception("Invalid status update. Only Accepted or Rejected is allowed.");
            }

            request.RequestStatus = dto.RequestStatus;
            if (!string.IsNullOrEmpty(dto.Notes))
            {
                request.Notes = $"{request.Notes}\n[Supplier Note]: {dto.Notes}".Trim();
            }

            await _context.SaveChangesAsync();

            // Trigger Email to Requester
            if (request.RequestedByUser != null && !string.IsNullOrEmpty(request.RequestedByUser.Email))
            {
                try
                {
                    await _emailService.SendPurchaseRequestStatusUpdatedAsync(
                        request.RequestedByUser.Email,
                        request.RequestNumber,
                        request.RequestStatus.ToString(),
                        dto.Notes);
                }
                catch
                {
                    // Ignore email sending error
                }
            }

            return true;
        }

        public async Task<bool> ReceiveDeliveryAsync(int id, ReceivePurchaseRequestDto dto, int receivedByUserId)
        {
            var request = await _context.PurchaseRequests
                .Include(pr => pr.RequestedByUser)
                .Include(pr => pr.PurchaseRequestItems)
                    .ThenInclude(pri => pri.Product)
                .FirstOrDefaultAsync(pr => pr.RequestId == id);

            if (request == null) return false;

            if (request.RequestStatus != RequestStatus.Accepted)
            {
                throw new Exception("Only accepted purchase requests can be received.");
            }

            foreach (var receivedItemDto in dto.Items)
            {
                var item = request.PurchaseRequestItems.FirstOrDefault(pri => pri.RequestItemId == receivedItemDto.RequestItemId);
                if (item == null)
                {
                    throw new Exception($"Purchase request item with ID {receivedItemDto.RequestItemId} not found on this request.");
                }

                if (item.IsReceived)
                {
                    continue;
                }

                item.DeliveredQuantity = receivedItemDto.DeliveredQuantity;
                item.IsReceived = true;
                if (!string.IsNullOrEmpty(receivedItemDto.Notes))
                {
                    item.Notes = $"{item.Notes}\n[Delivery Note]: {receivedItemDto.Notes}".Trim();
                }

                var transactionDto = new CreateStockTransactionDto
                {
                    ProductId = item.ProductId,
                    Type = StockTransactionType.StockIn,
                    Quantity = receivedItemDto.DeliveredQuantity,
                    Notes = $"Purchase request delivery for {request.RequestNumber}"
                };

                await _stockTransactionService.RecordTransactionAsync(transactionDto, receivedByUserId);
            }

            request.RequestStatus = RequestStatus.Delivered;
            request.DeliveredDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Trigger Email to Requester
            if (request.RequestedByUser != null && !string.IsNullOrEmpty(request.RequestedByUser.Email))
            {
                try
                {
                    await _emailService.SendPurchaseRequestStatusUpdatedAsync(
                        request.RequestedByUser.Email,
                        request.RequestNumber,
                        "Delivered",
                        null);
                }
                catch
                {
                    // Ignore email sending error
                }
            }

            return true;
        }

        public async Task<bool> CancelRequestAsync(int id)
        {
            var request = await _context.PurchaseRequests
                .Include(pr => pr.RequestedByUser)
                .FirstOrDefaultAsync(pr => pr.RequestId == id);

            if (request == null) return false;

            if (request.RequestStatus != RequestStatus.Pending)
            {
                throw new Exception("Only pending purchase requests can be cancelled.");
            }

            request.RequestStatus = RequestStatus.Cancelled;
            await _context.SaveChangesAsync();

            // Trigger Email to Requester
            if (request.RequestedByUser != null && !string.IsNullOrEmpty(request.RequestedByUser.Email))
            {
                try
                {
                    await _emailService.SendPurchaseRequestStatusUpdatedAsync(
                        request.RequestedByUser.Email,
                        request.RequestNumber,
                        "Cancelled",
                        null);
                }
                catch
                {
                    // Ignore email sending error
                }
            }

            return true;
        }

        public async Task<IEnumerable<PurchaseRequestSuggestionDto>> GetReorderSuggestionsAsync()
        {
            var lowStockProducts = await _context.Products
                .Include(p => p.Supplier)
                .Where(p => p.Quantity <= p.ReorderLevel && p.SupplierId > 0)
                .ToListAsync();

            var suggestions = lowStockProducts
                .GroupBy(p => new { p.SupplierId, p.Supplier.CompanyName })
                .Select(g => new PurchaseRequestSuggestionDto
                {
                    SupplierId = g.Key.SupplierId,
                    SupplierCompanyName = g.Key.CompanyName,
                    Items = g.Select(p => new PurchaseRequestSuggestionItemDto
                    {
                        ProductId = p.ProductId,
                        ProductName = p.Name,
                        ProductBarcode = p.Barcode,
                        CurrentQuantity = p.Quantity,
                        ReorderLevel = p.ReorderLevel,
                        SuggestedQuantity = Math.Max(10, (p.ReorderLevel * 2) - p.Quantity),
                        UnitCost = p.CostPrice
                    }).ToList()
                })
                .ToList();

            return suggestions;
        }
    }
}
