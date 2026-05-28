using System.Threading.Tasks;

namespace InventoryManagementSystem.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string toName, string subject, string htmlContent);
        Task SendEmailVerificationAsync(string email, string verificationLink);
        Task SendPurchaseRequestCreatedAsync(string supplierEmail, string supplierName, string requestNumber);
        Task SendPurchaseRequestStatusUpdatedAsync(string requesterEmail, string requestNumber, string status, string? notes);
        Task SendLowStockAlertAsync(string managerEmail, string productName, int currentQty, int reorderLevel);
        Task SendAccountActivatedAsync(string userEmail, string role);
        Task SendNewUserWelcomeAsync(string email, string password, string role, string verificationLink);
    }
}
