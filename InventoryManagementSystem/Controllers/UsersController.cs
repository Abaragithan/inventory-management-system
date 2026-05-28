using FluentValidation;
using InventoryManagementSystem.Models.DTOs.User;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagementSystem.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _service;
    private readonly IValidator<CreateUserDto> _createValidator;
    private readonly IValidator<UpdateUserDto> _updateValidator;

    public UsersController(
        IUserService service,
        IValidator<CreateUserDto> createValidator,
        IValidator<UpdateUserDto> updateValidator)
    {
        _service = service;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] int? page,
        [FromQuery] int? pageSize)
    {
        if (page == null && pageSize == null)
        {
            return Ok(await _service.GetAllAsync());
        }

        var pagedResult = await _service.GetPagedAsync(
            search,
            role,
            page.Value,
            pageSize.Value);

        return Ok(pagedResult);
    }

    [HttpGet("unassigned-suppliers")]
    public async Task<IActionResult> GetUnassignedSuppliers()
    {
        return Ok(await _service.GetUnassignedSuppliersAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        return Ok(await _service.GetByIdAsync(id));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateUserDto dto)
    {
        var validation = await _createValidator.ValidateAsync(dto);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => e.ErrorMessage);
            return BadRequest(new { message = string.Join("; ", errors) });
        }

        return Ok(await _service.CreateAsync(dto));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateUserDto dto)
    {
        var validation = await _updateValidator.ValidateAsync(dto);
        if (!validation.IsValid)
        {
            var errors = validation.Errors.Select(e => e.ErrorMessage);
            return BadRequest(new { message = string.Join("; ", errors) });
        }

        await _service.UpdateAsync(id, dto);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}