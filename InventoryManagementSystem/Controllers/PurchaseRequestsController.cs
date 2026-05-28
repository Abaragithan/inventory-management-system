using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentValidation;
using InventoryManagementSystem.Models.DTOs.PurchaseRequest;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagementSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PurchaseRequestsController : ControllerBase
    {
        private readonly IPurchaseRequestService _purchaseRequestService;
        private readonly ISupplierService _supplierService;
        private readonly IValidator<CreatePurchaseRequestDto> _createValidator;
        private readonly IValidator<UpdatePurchaseRequestStatusDto> _updateStatusValidator;
        private readonly IValidator<ReceivePurchaseRequestDto> _receiveValidator;

        public PurchaseRequestsController(
            IPurchaseRequestService purchaseRequestService,
            ISupplierService supplierService,
            IValidator<CreatePurchaseRequestDto> createValidator,
            IValidator<UpdatePurchaseRequestStatusDto> updateStatusValidator,
            IValidator<ReceivePurchaseRequestDto> receiveValidator)
        {
            _purchaseRequestService = purchaseRequestService;
            _supplierService = supplierService;
            _createValidator = createValidator;
            _updateStatusValidator = updateStatusValidator;
            _receiveValidator = receiveValidator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search,
            [FromQuery] string? status,
            [FromQuery] int? supplierId,
            [FromQuery] int? page,
            [FromQuery] int? pageSize)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            if (role == "Admin" || role == "InventoryManager")
            {
                if (page == null && pageSize == null)
                {
                    var requests = await _purchaseRequestService.GetAllAsync();
                    return Ok(requests);
                }

                var pagedResult = await _purchaseRequestService.GetPagedAsync(
                    search,
                    status,
                    supplierId,
                    page.Value,
                    pageSize.Value);

                return Ok(pagedResult);
            }
            else if (role == "Supplier")
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "User identity not found." });
                }
                var supplier = await _supplierService.GetByUserIdAsync(userId);
                if (supplier == null)
                {
                    return NotFound(new { message = "Supplier profile not found." });
                }

                if (page == null && pageSize == null)
                {
                    var requests = await _purchaseRequestService.GetBySupplierIdAsync(supplier.SupplierId);
                    return Ok(requests);
                }

                var pagedResult = await _purchaseRequestService.GetPagedAsync(
                    search,
                    status,
                    supplier.SupplierId,
                    page.Value,
                    pageSize.Value);

                return Ok(pagedResult);
            }

            return Forbid();
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var request = await _purchaseRequestService.GetByIdAsync(id);
            if (request == null)
            {
                return NotFound();
            }

            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role == "Supplier")
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { message = "User identity not found." });
                }
                var supplier = await _supplierService.GetByUserIdAsync(userId);
                if (supplier == null || request.SupplierId != supplier.SupplierId)
                {
                    return Forbid();
                }
            }

            return Ok(request);
        }

        [Authorize(Roles = "Admin,InventoryManager")]
        [HttpPost]
        public async Task<IActionResult> Create(CreatePurchaseRequestDto dto)
        {
            var validation = await _createValidator.ValidateAsync(dto);
            if (!validation.IsValid)
            {
                var errors = validation.Errors.Select(e => e.ErrorMessage);
                return BadRequest(new { message = string.Join("; ", errors) });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User identity not found." });
            }
            var createdRequest = await _purchaseRequestService.CreateAsync(dto, userId);

            return CreatedAtAction(
                nameof(GetById),
                new { id = createdRequest.RequestId },
                createdRequest);
        }

        [Authorize(Roles = "Supplier")]
        [HttpPut("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, UpdatePurchaseRequestStatusDto dto)
        {
            var validation = await _updateStatusValidator.ValidateAsync(dto);
            if (!validation.IsValid)
            {
                var errors = validation.Errors.Select(e => e.ErrorMessage);
                return BadRequest(new { message = string.Join("; ", errors) });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User identity not found." });
            }
            var supplier = await _supplierService.GetByUserIdAsync(userId);
            if (supplier == null)
            {
                return NotFound(new { message = "Supplier profile not found." });
            }

            var updated = await _purchaseRequestService.UpdateStatusAsync(id, dto, supplier.SupplierId);
            if (!updated)
            {
                return NotFound();
            }

            return NoContent();
        }

        [Authorize(Roles = "Admin,InventoryManager")]
        [HttpPut("{id:int}/receive")]
        public async Task<IActionResult> ReceiveDelivery(int id, ReceivePurchaseRequestDto dto)
        {
            var validation = await _receiveValidator.ValidateAsync(dto);
            if (!validation.IsValid)
            {
                var errors = validation.Errors.Select(e => e.ErrorMessage);
                return BadRequest(new { message = string.Join("; ", errors) });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User identity not found." });
            }
            var updated = await _purchaseRequestService.ReceiveDeliveryAsync(id, dto, userId);
            if (!updated)
            {
                return NotFound();
            }

            return NoContent();
        }

        [Authorize(Roles = "Admin,InventoryManager")]
        [HttpPut("{id:int}/cancel")]
        public async Task<IActionResult> CancelRequest(int id)
        {
            try
            {
                var cancelled = await _purchaseRequestService.CancelRequestAsync(id);
                if (!cancelled)
                {
                    return NotFound(new { message = "Purchase request not found." });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin,InventoryManager")]
        [HttpGet("suggestions")]
        public async Task<IActionResult> GetSuggestions()
        {
            var suggestions = await _purchaseRequestService.GetReorderSuggestionsAsync();
            return Ok(suggestions);
        }
    }
}
