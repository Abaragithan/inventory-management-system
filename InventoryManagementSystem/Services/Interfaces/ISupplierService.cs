using InventoryManagementSystem.Models.DTOs.Supplier;
using InventoryManagementSystem.Models.DTOs.Shared;

namespace InventoryManagementSystem.Services.Interfaces;

public interface ISupplierService
{
    Task<IEnumerable<SupplierResponseDto>> GetAllAsync();

    Task<PagedResult<SupplierResponseDto>> GetPagedAsync(
        string? search,
        string? status,
        int page,
        int pageSize);

    Task<SupplierResponseDto?> GetByIdAsync(int id);

    Task<SupplierResponseDto?> GetByUserIdAsync(int userId);

    Task<SupplierResponseDto> CreateAsync(
        CreateSupplierDto dto,
        int userId);

    Task<bool> UpdateAsync(
        int id,
        UpdateSupplierDto dto);

    Task<bool> DeleteAsync(int id);
}