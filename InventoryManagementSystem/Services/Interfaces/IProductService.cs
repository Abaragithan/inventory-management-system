using InventoryManagementSystem.Models.DTOs.Product;
using InventoryManagementSystem.Models.DTOs.Shared;

namespace InventoryManagementSystem.Services.Interfaces;

public interface IProductService
{
    Task<IEnumerable<ProductListDto>> GetAllAsync();

    Task<PagedResult<ProductListDto>> GetPagedAsync(
        string? search,
        string? category,
        string? supplier,
        int page,
        int pageSize);

    Task<ProductResponseDto?> GetByIdAsync(int id);

    Task<ProductResponseDto> CreateAsync(
        CreateProductDto dto);

    Task<bool> UpdateAsync(
        int id,
        UpdateProductDto dto);

    Task<bool> DeleteAsync(int id);
}