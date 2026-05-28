using System.Collections.Generic;
using System.Threading.Tasks;
using InventoryManagementSystem.Models.DTOs.PurchaseRequest;
using InventoryManagementSystem.Models.DTOs.Shared;

namespace InventoryManagementSystem.Services.Interfaces
{
    public interface IPurchaseRequestService
    {
        Task<IEnumerable<PurchaseRequestResponseDto>> GetAllAsync();
        Task<IEnumerable<PurchaseRequestResponseDto>> GetBySupplierIdAsync(int supplierId);
        Task<PagedResult<PurchaseRequestResponseDto>> GetPagedAsync(
            string? search,
            string? status,
            int? supplierId,
            int page,
            int pageSize);
        Task<PurchaseRequestResponseDto?> GetByIdAsync(int id);
        Task<PurchaseRequestResponseDto> CreateAsync(CreatePurchaseRequestDto dto, int requestedByUserId);
        Task<bool> UpdateStatusAsync(int id, UpdatePurchaseRequestStatusDto dto, int? supplierIdFilter = null);
        Task<bool> ReceiveDeliveryAsync(int id, ReceivePurchaseRequestDto dto, int receivedByUserId);
        Task<bool> CancelRequestAsync(int id);
        Task<IEnumerable<PurchaseRequestSuggestionDto>> GetReorderSuggestionsAsync();
    }
}
