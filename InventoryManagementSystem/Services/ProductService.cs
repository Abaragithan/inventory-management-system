using AutoMapper;
using InventoryManagementSystem.Data;
using InventoryManagementSystem.Models.DTOs.Product;
using InventoryManagementSystem.Models.DTOs.Shared;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagementSystem.Services;

public class ProductService : IProductService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public ProductService(
        AppDbContext context,
        IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ProductListDto>> GetAllAsync()
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .AsNoTracking()
            .ToListAsync();

        return _mapper.Map<List<ProductListDto>>(products);
    }

    public async Task<PagedResult<ProductListDto>> GetPagedAsync(
        string? search,
        string? category,
        string? supplier,
        int page,
        int pageSize)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || p.Barcode.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(p => p.Category.Name == category);
        }

        if (!string.IsNullOrWhiteSpace(supplier))
        {
            query = query.Where(p => p.Supplier.CompanyName == supplier);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var totalDbCount = await _context.Products.CountAsync();
        var outOfStock = await _context.Products.CountAsync(p => p.Quantity == 0);
        var lowStock = await _context.Products.CountAsync(p => p.Quantity > 0 && p.Quantity <= 10);

        return new PagedResult<ProductListDto>
        {
            Items = _mapper.Map<IEnumerable<ProductListDto>>(items),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            Summary = new Dictionary<string, int>
            {
                { "totalCount", totalDbCount },
                { "outOfStock", outOfStock },
                { "lowStock", lowStock }
            }
        };
    }

    public async Task<ProductResponseDto?> GetByIdAsync(int id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ProductId == id);

        if (product == null)
        {
            return null;
        }

        return _mapper.Map<ProductResponseDto>(product);
    }
    public async Task<ProductResponseDto> CreateAsync(
      CreateProductDto dto)
    {
        var barcodeExists = await _context.Products
            .AnyAsync(p => p.Barcode == dto.Barcode);

        if (barcodeExists)
        {
            throw new Exception(
                "A product with this barcode already exists.");
        }

        var categoryExists = await _context.Categories
            .AnyAsync(c => c.CategoryId == dto.CategoryId);

        if (!categoryExists)
        {
            throw new Exception("Category not found.");
        }

        var supplierExists = await _context.Suppliers
            .AnyAsync(s => s.SupplierId == dto.SupplierId);

        if (!supplierExists)
        {
            throw new Exception("Supplier not found.");
        }

        var product = _mapper.Map<Product>(dto);

        _context.Products.Add(product);

        await _context.SaveChangesAsync();

        await _context.Entry(product)
            .Reference(p => p.Category)
            .LoadAsync();

        await _context.Entry(product)
            .Reference(p => p.Supplier)
            .LoadAsync();

        return _mapper.Map<ProductResponseDto>(product);
    }

    public async Task<bool> UpdateAsync(
        int id,
        UpdateProductDto dto)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.ProductId == id);

        if (product == null)
        {
            return false;
        }

        var categoryExists = await _context.Categories
            .AnyAsync(c => c.CategoryId == dto.CategoryId);

        if (!categoryExists)
        {
            throw new Exception("Category not found.");
        }

        var supplierExists = await _context.Suppliers
            .AnyAsync(s => s.SupplierId == dto.SupplierId);

        if (!supplierExists)
        {
            throw new Exception("Supplier not found.");
        }

        _mapper.Map(dto, product);

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.ProductId == id);

        if (product == null)
        {
            return false;
        }

        // Pre-check: ensure no stock transactions reference this product
        var hasTransactions = await _context.StockTransactions
            .AnyAsync(st => st.ProductId == id);

        if (hasTransactions)
        {
            throw new InvalidOperationException(
                $"Cannot delete product '{product.Name}' because it has associated stock transaction history. " +
                "Products with transaction records cannot be removed.");
        }

        // Pre-check: ensure no purchase request items reference this product
        var hasPurchaseItems = await _context.PurchaseRequestItems
            .AnyAsync(pri => pri.ProductId == id);

        if (hasPurchaseItems)
        {
            throw new InvalidOperationException(
                $"Cannot delete product '{product.Name}' because it is referenced in purchase requests. " +
                "Please complete or cancel the related purchase requests first.");
        }

        _context.Products.Remove(product);

        await _context.SaveChangesAsync();

        return true;
    }
}