using AutoMapper;
using InventoryManagementSystem.Data;
using InventoryManagementSystem.Enums;
using InventoryManagementSystem.Models.DTOs.StockTransaction;
using InventoryManagementSystem.Models.DTOs.Shared;
using InventoryManagementSystem.Models.Entities;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagementSystem.Services
{
    public class StockTransactionService : IStockTransactionService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IEmailService _emailService;

        public StockTransactionService(AppDbContext context, IMapper mapper, IEmailService emailService)
        {
            _context = context;
            _mapper = mapper;
            _emailService = emailService;
        }

        public async Task<StockTransactionResponseDto> RecordTransactionAsync(CreateStockTransactionDto dto, int userId)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.ProductId == dto.ProductId);

            if (product == null)
            {
                throw new Exception("Product not found.");
            }

            // Adjust stock count based on type
            switch (dto.Type)
            {
                case StockTransactionType.StockIn:
                case StockTransactionType.Return:
                    product.Quantity += dto.Quantity;
                    break;

                case StockTransactionType.StockOut:
                    if (product.Quantity < dto.Quantity)
                    {
                        throw new Exception("Insufficient stock available for this operation.");
                    }
                    product.Quantity -= dto.Quantity;
                    break;

                case StockTransactionType.Adjustment:
                    // Quantity in adjustment is relative (positive adds, negative subtracts)
                    if (product.Quantity + dto.Quantity < 0)
                    {
                        throw new Exception("Stock quantity cannot be adjusted below zero.");
                    }
                    product.Quantity += dto.Quantity;
                    break;

                default:
                    throw new Exception("Invalid stock transaction type.");
            }

            var transaction = new StockTransaction
            {
                ProductId = dto.ProductId,
                UserId = userId,
                Type = dto.Type,
                Quantity = dto.Quantity,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow
            };

            _context.StockTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            // Check for low stock alert
            if (product.Quantity <= product.ReorderLevel)
            {
                try
                {
                    var managers = await _context.Users
                        .Where(u => (u.Role == UserRole.Admin || u.Role == UserRole.InventoryManager) && u.IsEmailVerified && u.IsActive)
                        .Select(u => u.Email)
                        .ToListAsync();

                    foreach (var managerEmail in managers)
                    {
                        await _emailService.SendLowStockAlertAsync(managerEmail, product.Name, product.Quantity, product.ReorderLevel);
                    }
                }
                catch
                {
                    // Ignore email errors to preserve transaction stability
                }
            }

            // Load navigation properties for response DTO
            await _context.Entry(transaction).Reference(t => t.Product).LoadAsync();
            await _context.Entry(transaction).Reference(t => t.User).LoadAsync();

            return _mapper.Map<StockTransactionResponseDto>(transaction);
        }

        public async Task<IEnumerable<StockTransactionResponseDto>> GetRecentTransactionsAsync(int limit)
        {
            var transactions = await _context.StockTransactions
                .Include(t => t.Product)
                .Include(t => t.User)
                .OrderByDescending(t => t.CreatedAt)
                .Take(limit)
                .AsNoTracking()
                .ToListAsync();

            return _mapper.Map<IEnumerable<StockTransactionResponseDto>>(transactions);
        }

        public async Task<PagedResult<StockTransactionResponseDto>> GetPagedTransactionsAsync(
            string? search,
            string? type,
            int page,
            int pageSize)
        {
            var query = _context.StockTransactions
                .Include(t => t.Product)
                .Include(t => t.User)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(t => 
                    t.Product.Name.ToLower().Contains(s) || 
                    t.User.Email.ToLower().Contains(s) ||
                    (t.Notes != null && t.Notes.ToLower().Contains(s)));
            }

            if (!string.IsNullOrWhiteSpace(type))
            {
                if (Enum.TryParse<StockTransactionType>(type, out var typeEnum))
                {
                    query = query.Where(t => t.Type == typeEnum);
                }
                else
                {
                    query = query.Where(t => false);
                }
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var totalDbCount = await _context.StockTransactions.CountAsync();
            var stockInCount = await _context.StockTransactions.CountAsync(t => t.Type == StockTransactionType.StockIn);
            var stockOutCount = await _context.StockTransactions.CountAsync(t => t.Type == StockTransactionType.StockOut);

            return new PagedResult<StockTransactionResponseDto>
            {
                Items = _mapper.Map<IEnumerable<StockTransactionResponseDto>>(items),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                Summary = new Dictionary<string, int>
                {
                    { "totalCount", totalDbCount },
                    { "stockInCount", stockInCount },
                    { "stockOutCount", stockOutCount }
                }
            };
        }
    }
}
