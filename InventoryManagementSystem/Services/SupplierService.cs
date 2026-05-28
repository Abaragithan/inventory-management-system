using AutoMapper;
using InventoryManagementSystem.Data;
using InventoryManagementSystem.Models.DTOs.Supplier;
using InventoryManagementSystem.Models.DTOs.Shared;
using InventoryManagementSystem.Models.Entities;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagementSystem.Services;

public class SupplierService : ISupplierService
{
    private readonly AppDbContext _context;

    private readonly IMapper _mapper;

    public SupplierService(
        AppDbContext context,
        IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<SupplierResponseDto>> GetAllAsync()
    {
        var suppliers = await _context.Suppliers
            .Include(s => s.User)
            .AsNoTracking()
            .ToListAsync();

        return _mapper.Map<IEnumerable<SupplierResponseDto>>(suppliers);
    }

    public async Task<PagedResult<SupplierResponseDto>> GetPagedAsync(
        string? search,
        string? status,
        int page,
        int pageSize)
    {
        var query = _context.Suppliers.Include(sup => sup.User).AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(sup =>
                sup.CompanyName.ToLower().Contains(s) ||
                sup.ContactPerson.ToLower().Contains(s) ||
                sup.Email.ToLower().Contains(s) ||
                (sup.Phone != null && sup.Phone.ToLower().Contains(s)) ||
                (sup.Address != null && sup.Address.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var isAct = status.Equals("active", StringComparison.OrdinalIgnoreCase);
            query = query.Where(sup => sup.User.IsActive == isAct);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(sup => sup.CompanyName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var totalDbCount = await _context.Suppliers.CountAsync();
        var activeCount = await _context.Suppliers.CountAsync(sup => sup.User.IsActive);
        var inactiveCount = totalDbCount - activeCount;

        return new PagedResult<SupplierResponseDto>
        {
            Items = _mapper.Map<IEnumerable<SupplierResponseDto>>(items),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            Summary = new Dictionary<string, int>
            {
                { "totalCount", totalDbCount },
                { "activeCount", activeCount },
                { "inactiveCount", inactiveCount }
            }
        };
    }

    public async Task<SupplierResponseDto?> GetByIdAsync(int id)
    {
        var supplier = await _context.Suppliers
            .Include(s => s.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.SupplierId == id);

        if (supplier == null)
        {
            return null;
        }

        return _mapper.Map<SupplierResponseDto>(supplier);
    }

    public async Task<SupplierResponseDto?> GetByUserIdAsync(int userId)
    {
        var supplier = await _context.Suppliers
            .Include(s => s.User)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (supplier == null)
        {
            return null;
        }

        return _mapper.Map<SupplierResponseDto>(supplier);
    }

    public async Task<SupplierResponseDto> CreateAsync(
        CreateSupplierDto dto,
        int userId)
    {
        // Check whether user exists
        var userExists = await _context.Users
            .AnyAsync(u => u.UserId == userId);

        if (!userExists)
        {
            throw new Exception("User not found.");
        }

        // Check whether supplier profile already exists
        var supplierExists = await _context.Suppliers
            .AnyAsync(s => s.UserId == userId);

        if (supplierExists)
        {
            throw new Exception(
                "Supplier profile already exists for this user.");
        }

        var supplier = _mapper.Map<Supplier>(dto);

        // Assign relationship
        supplier.UserId = userId;

        _context.Suppliers.Add(supplier);

        await _context.SaveChangesAsync();

        // Load related User for mapping
        await _context.Entry(supplier).Reference(s => s.User).LoadAsync();

        return _mapper.Map<SupplierResponseDto>(supplier);
    }

    public async Task<bool> UpdateAsync(
        int id,
        UpdateSupplierDto dto)
    {
        var supplier = await _context.Suppliers
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.SupplierId == id);

        if (supplier == null)
        {
            return false;
        }

        _mapper.Map(dto, supplier);

        // Propagate active status to the linked User
        if (supplier.User != null)
        {
            supplier.User.IsActive = dto.IsActive;
        }

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var supplier = await _context.Suppliers
            .FirstOrDefaultAsync(s => s.SupplierId == id);

        if (supplier == null)
        {
            return false;
        }

        // Pre-check: ensure no products are linked to this supplier
        var hasProducts = await _context.Products
            .AnyAsync(p => p.SupplierId == id);

        if (hasProducts)
        {
            throw new InvalidOperationException(
                $"Cannot delete supplier '{supplier.CompanyName}' because it has associated products. " +
                "Please remove or reassign the products to a different supplier first.");
        }

        // Pre-check: ensure no purchase requests reference this supplier
        var hasPurchaseRequests = await _context.PurchaseRequests
            .AnyAsync(pr => pr.SupplierId == id);

        if (hasPurchaseRequests)
        {
            throw new InvalidOperationException(
                $"Cannot delete supplier '{supplier.CompanyName}' because it has associated purchase requests. " +
                "Please cancel or complete all purchase requests for this supplier first.");
        }

        _context.Suppliers.Remove(supplier);

        await _context.SaveChangesAsync();

        return true;
    }
}