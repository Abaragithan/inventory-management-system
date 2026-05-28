using AutoMapper;
using InventoryManagementSystem.Data;
using InventoryManagementSystem.Models.DTOs.Category;
using InventoryManagementSystem.Models.DTOs.Shared;
using InventoryManagementSystem.Models.Entities;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagementSystem.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly AppDbContext _context;

        private readonly IMapper _mapper;

        public CategoryService(
            AppDbContext context,
            IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<CategoryListDto>>
        GetAllAsync()
        {
            var categories = await _context.Categories
                .ToListAsync();

            return _mapper.Map<
                IEnumerable<CategoryListDto>>(categories);
        }

        public async Task<PagedResult<CategoryListDto>> GetPagedAsync(
            string? search,
            int page,
            int pageSize)
        {
            var query = _context.Categories.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim().ToLower();
                query = query.Where(c => c.Name.ToLower().Contains(s) || 
                                         (c.Description != null && c.Description.ToLower().Contains(s)));
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderBy(c => c.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var totalDbCount = await _context.Categories.CountAsync();
            var withDesc = await _context.Categories.CountAsync(c => c.Description != null && c.Description.Trim() != "");
            var withoutDesc = totalDbCount - withDesc;

            return new PagedResult<CategoryListDto>
            {
                Items = _mapper.Map<IEnumerable<CategoryListDto>>(items),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                Summary = new Dictionary<string, int>
                {
                    { "totalCount", totalDbCount },
                    { "withDescription", withDesc },
                    { "withoutDescription", withoutDesc }
                }
            };
        }


        public async Task<CategoryResponseDto?>
        GetByIdAsync(int id)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c =>
                    c.CategoryId == id);

            if (category == null)
            {
                return null;
            }

            return _mapper.Map<CategoryResponseDto>(
                category);
        }

        public async Task<CategoryResponseDto>
        CreateAsync(CreateCategoryDto dto)
        {
            var category = _mapper.Map<Category>(dto);

            _context.Categories.Add(category);

            await _context.SaveChangesAsync();

            return _mapper.Map<CategoryResponseDto>(
                category);
        }

        public async Task<bool> UpdateAsync(
        int id,
        UpdateCategoryDto dto)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c =>
                    c.CategoryId == id);

            if (category == null)
            {
                return false;
            }

            _mapper.Map(dto, category);

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c =>
                    c.CategoryId == id);

            if (category == null)
            {
                return false;
            }

            // Pre-check: ensure no products are linked to this category
            var hasProducts = await _context.Products
                .AnyAsync(p => p.CategoryId == id);

            if (hasProducts)
            {
                throw new InvalidOperationException(
                    $"Cannot delete category '{category.Name}' because it has associated products. " +
                    "Please remove or reassign the products to a different category first.");
            }

            _context.Categories.Remove(category);

            await _context.SaveChangesAsync();

            return true;
        }


    }
}
