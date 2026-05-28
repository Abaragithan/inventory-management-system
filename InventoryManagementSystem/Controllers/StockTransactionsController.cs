using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentValidation;
using InventoryManagementSystem.Models.DTOs.StockTransaction;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagementSystem.Controllers
{
    [Authorize(Roles = "Admin,InventoryManager")]
    [ApiController]
    [Route("api/[controller]")]
    public class StockTransactionsController : ControllerBase
    {
        private readonly IStockTransactionService _transactionService;
        private readonly IValidator<CreateStockTransactionDto> _validator;

        public StockTransactionsController(
            IStockTransactionService transactionService,
            IValidator<CreateStockTransactionDto> validator)
        {
            _transactionService = transactionService;
            _validator = validator;
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateStockTransactionDto dto)
        {
            var validationResult = await _validator.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage);
                return BadRequest(new { message = string.Join("; ", errors) });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User identity not found in token." });
            }

            var result = await _transactionService.RecordTransactionAsync(dto, userId);
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetRecent(
            [FromQuery] string? search,
            [FromQuery] string? type,
            [FromQuery] int? page,
            [FromQuery] int? pageSize,
            [FromQuery] int limit = 50)
        {
            if (page == null && pageSize == null)
            {
                var result = await _transactionService.GetRecentTransactionsAsync(limit);
                return Ok(result);
            }

            var pagedResult = await _transactionService.GetPagedTransactionsAsync(
                search,
                type,
                page.Value,
                pageSize.Value);

            return Ok(pagedResult);
        }
    }
}
