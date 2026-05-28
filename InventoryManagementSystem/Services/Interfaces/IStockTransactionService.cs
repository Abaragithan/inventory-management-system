using System.Collections.Generic;
using System.Threading.Tasks;
using InventoryManagementSystem.Models.DTOs.StockTransaction;
using InventoryManagementSystem.Models.DTOs.Shared;

namespace InventoryManagementSystem.Services.Interfaces
{
    public interface IStockTransactionService
    {
        Task<StockTransactionResponseDto> RecordTransactionAsync(CreateStockTransactionDto dto, int userId);
        Task<IEnumerable<StockTransactionResponseDto>> GetRecentTransactionsAsync(int limit);
        Task<PagedResult<StockTransactionResponseDto>> GetPagedTransactionsAsync(
            string? search,
            string? type,
            int page,
            int pageSize);
    }
}
