using System.Security.Claims;
using FluentValidation;
using InventoryManagementSystem.Models.DTOs.Supplier;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagementSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SuppliersController : ControllerBase
    {
        private readonly ISupplierService _supplierService;
        private readonly IValidator<CreateSupplierDto> _createValidator;
        private readonly IValidator<UpdateSupplierDto> _updateValidator;

        public SuppliersController(
            ISupplierService supplierService,
            IValidator<CreateSupplierDto> createValidator,
            IValidator<UpdateSupplierDto> updateValidator)
        {
            _supplierService = supplierService;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
        }

        [Authorize(Roles = "Admin, InventoryManager")]
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] string? status,
            [FromQuery] int? page,
            [FromQuery] int? pageSize)
        {
            if (page == null && pageSize == null)
            {
                var suppliers = await _supplierService.GetAllAsync();
                return Ok(suppliers);
            }

            var pagedResult = await _supplierService.GetPagedAsync(
                search,
                status,
                page.Value,
                pageSize.Value);

            return Ok(pagedResult);
        }

        [Authorize(Roles = "Admin, InventoryManager")]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var supplier = await _supplierService.GetByIdAsync(id);
            if (supplier == null)
            {
                return NotFound();
            }
            return Ok(supplier);
        }

        [Authorize(Roles = "Supplier")]
        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User identity not found in token." });
            }

            var supplier = await _supplierService.GetByUserIdAsync(userId);
            if (supplier == null)
            {
                return NotFound(new { message = "Supplier profile not found. Please contact an administrator to complete your registration." });
            }

            return Ok(supplier);
        }

        [Authorize(Roles = "Supplier")]
        [HttpPut("my-profile")]
        public async Task<IActionResult> UpdateMyProfile(UpdateSupplierDto dto)
        {
            var validation = await _updateValidator.ValidateAsync(dto);
            if (!validation.IsValid)
            {
                var errors = validation.Errors.Select(e => e.ErrorMessage);
                return BadRequest(new { message = string.Join("; ", errors) });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User identity not found in token." });
            }

            var supplier = await _supplierService.GetByUserIdAsync(userId);
            if (supplier == null)
            {
                return NotFound(new { message = "Supplier profile not found." });
            }

            var updated = await _supplierService.UpdateAsync(supplier.SupplierId, dto);
            if (!updated)
            {
                return NotFound();
            }

            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("{userId:int}")]
        public async Task<IActionResult> Create(
            int userId,
            CreateSupplierDto dto)
        {
            var validation = await _createValidator.ValidateAsync(dto);
            if (!validation.IsValid)
            {
                var errors = validation.Errors.Select(e => e.ErrorMessage);
                return BadRequest(new { message = string.Join("; ", errors) });
            }

            var createdSupplier = await _supplierService.CreateAsync(dto, userId);
            return CreatedAtAction(
                nameof(GetById),
                new { id = createdSupplier.SupplierId },
                createdSupplier);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
            int id,
            UpdateSupplierDto dto)
        {
            var validation = await _updateValidator.ValidateAsync(dto);
            if (!validation.IsValid)
            {
                var errors = validation.Errors.Select(e => e.ErrorMessage);
                return BadRequest(new { message = string.Join("; ", errors) });
            }

            var updated = await _supplierService.UpdateAsync(id, dto);
            if (!updated)
            {
                return NotFound();
            }
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _supplierService.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}
