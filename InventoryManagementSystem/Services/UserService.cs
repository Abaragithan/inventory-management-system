using InventoryManagementSystem.Data;
using InventoryManagementSystem.Enums;
using InventoryManagementSystem.Models.DTOs.User;
using InventoryManagementSystem.Models.DTOs.Shared;
using InventoryManagementSystem.Models.Entities;
using InventoryManagementSystem.Services.Interfaces;
using InventoryManagementSystem.Helpers;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagementSystem.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;
    private readonly JwtTokenGenerator _jwt;

    public UserService(
        AppDbContext context,
        IEmailService emailService,
        JwtTokenGenerator jwt)
    {
        _context = context;
        _emailService = emailService;
        _jwt = jwt;
    }

    public async Task<IEnumerable<UserResponseDto>>
        GetAllAsync()
    {
        return await _context.Users
            .Select(x => new UserResponseDto
            {
                UserId = x.UserId,
                Email = x.Email,
                Role = x.Role.ToString(),
                IsActive = x.IsActive,
                IsEmailVerified = x.IsEmailVerified,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<PagedResult<UserResponseDto>> GetPagedAsync(
        string? search,
        string? role,
        int page,
        int pageSize)
    {
        var query = _context.Users.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(u => u.Email.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            if (Enum.TryParse<UserRole>(role, out var roleEnum))
            {
                query = query.Where(u => u.Role == roleEnum);
            }
            else
            {
                query = query.Where(u => false);
            }
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(u => u.Email)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new UserResponseDto
            {
                UserId = x.UserId,
                Email = x.Email,
                Role = x.Role.ToString(),
                IsActive = x.IsActive,
                IsEmailVerified = x.IsEmailVerified,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();

        var totalDbCount = await _context.Users.CountAsync();
        var staffCount = await _context.Users.CountAsync(u => u.Role == UserRole.Staff);
        var adminCount = await _context.Users.CountAsync(u => u.Role == UserRole.Admin);
        var managerCount = await _context.Users.CountAsync(u => u.Role == UserRole.InventoryManager);

        return new PagedResult<UserResponseDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            Summary = new Dictionary<string, int>
            {
                { "totalCount", totalDbCount },
                { "staffCount", staffCount },
                { "adminCount", adminCount },
                { "managerCount", managerCount }
            }
        };
    }

    public async Task<UserResponseDto>
        GetByIdAsync(int id)
    {
        var user = await _context.Users
            .FindAsync(id);

        if (user == null)
            throw new KeyNotFoundException($"User with ID {id} not found.");

        return new UserResponseDto
        {
            UserId = user.UserId,
            Email = user.Email,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            IsEmailVerified = user.IsEmailVerified,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<UserResponseDto>
        CreateAsync(CreateUserDto dto)
    {
        if (dto.Password != dto.ConfirmPassword)
            throw new ArgumentException("Passwords do not match.");

        Enum.TryParse<UserRole>(
            dto.Role,
            true,
            out var role);

        var user = new User
        {
            Email = dto.Email,

            PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    dto.Password),

            Role = role
        };

        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        var token = _jwt.GenerateEmailVerificationToken(user.Email);
        var verificationLink = $"http://localhost:5053/api/auth/verify-email?token={Uri.EscapeDataString(token)}";
        await _emailService.SendNewUserWelcomeAsync(user.Email, dto.Password, user.Role.ToString(), verificationLink);

        return await GetByIdAsync(user.UserId);
    }

    public async Task UpdateAsync(
        int id,
        UpdateUserDto dto)
    {
        var user = await _context.Users
            .FindAsync(id);

        if (user == null)
            throw new KeyNotFoundException($"User with ID {id} not found.");

        Enum.TryParse<UserRole>(
            dto.Role,
            true,
            out var role);

        var oldIsActive = user.IsActive;

        user.Email = dto.Email;
        user.Role = role;
        user.IsActive = dto.IsActive;
        user.IsEmailVerified = dto.IsEmailVerified;

        await _context.SaveChangesAsync();

        if (!oldIsActive && user.IsActive)
        {
            try
            {
                await _emailService.SendAccountActivatedAsync(user.Email, user.Role.ToString());
            }
            catch
            {
                // Ignore email errors
            }
        }
    }

    public async Task DeleteAsync(int id)
    {
        var user = await _context.Users
            .FindAsync(id);

        if (user == null)
            throw new KeyNotFoundException($"User with ID {id} not found.");

        // Pre-check: ensure no supplier profile is linked to this user
        var hasSupplier = await _context.Suppliers
            .AnyAsync(s => s.UserId == id);

        if (hasSupplier)
        {
            throw new InvalidOperationException(
                "Cannot delete this user because they have an associated supplier profile. " +
                "Please delete the supplier profile first.");
        }

        // Pre-check: ensure no stock transactions are linked to this user
        var hasTransactions = await _context.StockTransactions
            .AnyAsync(st => st.UserId == id);

        if (hasTransactions)
        {
            throw new InvalidOperationException(
                "Cannot delete this user because they have recorded stock transactions. " +
                "Users with transaction history cannot be removed.");
        }

        // Pre-check: ensure no purchase requests were created by this user
        var hasPurchaseRequests = await _context.PurchaseRequests
            .AnyAsync(pr => pr.RequestedByUserId == id);

        if (hasPurchaseRequests)
        {
            throw new InvalidOperationException(
                "Cannot delete this user because they have created purchase requests. " +
                "Users who have submitted purchase requests cannot be removed.");
        }

        _context.Users.Remove(user);
        
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<UserResponseDto>> GetUnassignedSuppliersAsync()
    {
        return await _context.Users
            .Where(u => u.Role == UserRole.Supplier && !_context.Suppliers.Any(s => s.UserId == u.UserId))
            .Select(x => new UserResponseDto
            {
                UserId = x.UserId,
                Email = x.Email,
                Role = x.Role.ToString(),
                IsActive = x.IsActive,
                IsEmailVerified = x.IsEmailVerified,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();
    }
}