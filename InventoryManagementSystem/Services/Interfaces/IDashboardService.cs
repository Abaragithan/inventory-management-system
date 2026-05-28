using System.Threading.Tasks;
using InventoryManagementSystem.Models.DTOs.Dashboard;

namespace InventoryManagementSystem.Services.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(System.DateTime? startDate = null, System.DateTime? endDate = null);
        Task<SupplierDashboardSummaryDto> GetSupplierDashboardSummaryAsync(int supplierId, System.DateTime? startDate = null, System.DateTime? endDate = null);
    }
}
