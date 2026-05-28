using FluentValidation;
using InventoryManagementSystem.Models.DTOs.Category;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagementSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;
        private readonly IValidator<CreateCategoryDto> _createValidator;
        private readonly IValidator<UpdateCategoryDto> _updateValidator;

        public CategoriesController(
            ICategoryService categoryService,
            IValidator<CreateCategoryDto> createValidator,
            IValidator<UpdateCategoryDto> updateValidator)
        {
            _categoryService = categoryService;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
        }

        [Authorize(Roles = "Admin,InventoryManager,Supplier")]
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] int? page,
            [FromQuery] int? pageSize)
        {
            if (page == null && pageSize == null)
            {
                var categories = await _categoryService
                    .GetAllAsync();
                return Ok(categories);
            }

            var pagedResult = await _categoryService.GetPagedAsync(
                search,
                page.Value,
                pageSize.Value);

            return Ok(pagedResult);
        }

        [Authorize(Roles = "Admin,InventoryManager,Supplier")]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _categoryService
                .GetByIdAsync(id);

            if (category == null)
            {
                return NotFound();
            }

            return Ok(category);
        }

        [Authorize(Roles = "Admin,InventoryManager")]
        [HttpPost]
        public async Task<IActionResult> Create(
        CreateCategoryDto dto)
        {
            var validation = await _createValidator.ValidateAsync(dto);
            if (!validation.IsValid)
            {
                var errors = validation.Errors.Select(e => e.ErrorMessage);
                return BadRequest(new { message = string.Join("; ", errors) });
            }

            var createdCategory = await _categoryService
                .CreateAsync(dto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = createdCategory.CategoryId },
                createdCategory);
        }

        [Authorize(Roles = "Admin,InventoryManager")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(
        int id,
        UpdateCategoryDto dto)
        {
            var validation = await _updateValidator.ValidateAsync(dto);
            if (!validation.IsValid)
            {
                var errors = validation.Errors.Select(e => e.ErrorMessage);
                return BadRequest(new { message = string.Join("; ", errors) });
            }

            var updated = await _categoryService
                .UpdateAsync(id, dto);

            if (!updated)
            {
                return NotFound();
            }

            return NoContent();
        }

        [Authorize(Roles = "Admin,InventoryManager")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _categoryService
                .DeleteAsync(id);

            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}
