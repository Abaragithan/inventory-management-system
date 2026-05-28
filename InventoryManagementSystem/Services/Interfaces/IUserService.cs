using InventoryManagementSystem.Models.DTOs.User;
using InventoryManagementSystem.Models.DTOs.Shared;

namespace InventoryManagementSystem.Services.Interfaces;

public interface IUserService
{
    Task<IEnumerable<UserResponseDto>>
        GetAllAsync();

    Task<PagedResult<UserResponseDto>> GetPagedAsync(
        string? search,
        string? role,
        int page,
        int pageSize);

    Task<UserResponseDto>
        GetByIdAsync(int id);

    Task<UserResponseDto>
        CreateAsync(CreateUserDto dto);

    Task UpdateAsync(
        int id,
        UpdateUserDto dto);

    Task DeleteAsync(int id);

    Task<IEnumerable<UserResponseDto>> GetUnassignedSuppliersAsync();
}