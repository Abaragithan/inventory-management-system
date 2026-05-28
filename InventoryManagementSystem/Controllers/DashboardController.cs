using System.Security.Claims;
using System.Threading.Tasks;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagementSystem.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        private readonly ISupplierService _supplierService;

        public DashboardController(
            IDashboardService dashboardService,
            ISupplierService supplierService)
        {
            _dashboardService = dashboardService;
            _supplierService = supplierService;
        }

        [Authorize(Roles = "Admin,InventoryManager")]
        [HttpGet]
        public async Task<IActionResult> GetSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var summary = await _dashboardService.GetDashboardSummaryAsync(startDate, endDate);
            return Ok(summary);
        }

        [Authorize(Roles = "Supplier")]
        [HttpGet("supplier")]
        public async Task<IActionResult> GetSupplierSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User identity not found in token." });
            }

            var supplierProfile = await _supplierService.GetByUserIdAsync(userId);
            if (supplierProfile == null)
            {
                return NotFound(new { message = "Supplier profile not found. Please contact an administrator to complete your registration." });
            }

            var summary = await _dashboardService.GetSupplierDashboardSummaryAsync(supplierProfile.SupplierId, startDate, endDate);
            return Ok(summary);
        }
    }
}
