using InventoryManagementSystem.Models.DTOs.Category;
using InventoryManagementSystem.Models.DTOs.Shared;

namespace InventoryManagementSystem.Services.Interfaces
{
    public interface ICategoryService
    {
        Task<IEnumerable<CategoryListDto>> GetAllAsync();

        Task<PagedResult<CategoryListDto>> GetPagedAsync(
            string? search,
            int page,
            int pageSize);

        Task<CategoryResponseDto?> GetByIdAsync(int id);

        Task<CategoryResponseDto> CreateAsync(
            CreateCategoryDto dto);

        Task<bool> UpdateAsync(
            int id,
            UpdateCategoryDto dto);

        Task<bool> DeleteAsync(int id);
    }
}
