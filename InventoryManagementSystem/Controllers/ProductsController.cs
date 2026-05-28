using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentValidation;
using InventoryManagementSystem.Models.DTOs.Product;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagementSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ISupplierService _supplierService;
    private readonly IValidator<CreateProductDto> _createValidator;
    private readonly IValidator<UpdateProductDto> _updateValidator;

    public ProductsController(
        IProductService productService,
        ISupplierService supplierService,
        IValidator<CreateProductDto> createValidator,
        IValidator<UpdateProductDto> updateValidator)
    {
        _productService = productService;
        _supplierService = supplierService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    // GET: api/products
    [Authorize(Roles = "Admin,InventoryManager,Supplier")]
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] string? supplier,
        [FromQuery] int? page,
        [FromQuery] int? pageSize)
    {
        string? resolvedSupplier = supplier;

        if (User.IsInRole("Supplier"))
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User identity not found in token." });
            }

            var supplierProfile = await _supplierService.GetByUserIdAsync(userId);
            if (supplierProfile == null)
            {
                return NotFound(new { message = "Supplier profile not found." });
            }

            resolvedSupplier = supplierProfile.CompanyName;
        }

        if (page == null && pageSize == null)
        {
            var products = await _productService.GetAllAsync();
            if (User.IsInRole("Supplier"))
            {
                products = products.Where(p => p.SupplierName == resolvedSupplier).ToList();
            }
            return Ok(products);
        }

        var pagedResult = await _productService.GetPagedAsync(
            search,
            category,
            resolvedSupplier,
            page.Value,
            pageSize.Value);

        if (User.IsInRole("Supplier") && pagedResult.Summary != null)
        {
            pagedResult.Summary["totalCount"] = pagedResult.TotalCount;
        }

        return Ok(pagedResult);
    }

    // GET: api/products/1
    [Authorize(Roles = "Admin,InventoryManager,Supplier")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductResponseDto>> GetById(int id)
    {
        var product = await _productService.GetByIdAsync(id);

        if (product == null)
        {
            return NotFound(new
            {
                Message = "Product not found"
            });
        }

        if (User.IsInRole("Supplier"))
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User identity not found in token." });
            }

            var supplierProfile = await _supplierService.GetByUserIdAsync(userId);
            if (supplierProfile == null || product.SupplierId != supplierProfile.SupplierId)
            {
                return Forbid();
            }
        }

        return Ok(product);
    }

    // POST: api/products
    [Authorize(Roles = "Admin,InventoryManager")]
    [HttpPost]
    public async Task<ActionResult<ProductResponseDto>> Create(CreateProductDto dto)
    {
        var validation = await _createValidator.ValidateAsync(dto);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => e.ErrorMessage);
            return BadRequest(new { message = string.Join("; ", errors) });
        }

        var createdProduct = await _productService.CreateAsync(dto);

        return CreatedAtAction(
            nameof(GetById),
            new { id = createdProduct.ProductId },
            createdProduct);
    }

    // PUT: api/products/1
    [Authorize(Roles = "Admin,InventoryManager")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateProductDto dto)
    {
        var validation = await _updateValidator.ValidateAsync(dto);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => e.ErrorMessage);
            return BadRequest(new { message = string.Join("; ", errors) });
        }

        var updated = await _productService.UpdateAsync(id, dto);

        if (!updated)
        {
            return NotFound(new
            {
                Message = "Product not found"
            });
        }

        return NoContent();
    }

    // DELETE: api/products/1
    [Authorize(Roles = "Admin,InventoryManager")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _productService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound(new
            {
                Message = "Product not found"
            });
        }

        return NoContent();
    }
}