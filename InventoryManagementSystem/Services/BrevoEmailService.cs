using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using InventoryManagementSystem.Services.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace InventoryManagementSystem.Services
{
    public class BrevoEmailService : IEmailService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<BrevoEmailService> _logger;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly string? _apiKey;
        private readonly string _senderEmail;
        private readonly string _senderName;

        public BrevoEmailService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<BrevoEmailService> logger,
            IWebHostEnvironment webHostEnvironment)
        {
            _httpClient = httpClient;
            _logger = logger;
            _webHostEnvironment = webHostEnvironment;
            _apiKey = configuration["Brevo:ApiKey"];
            _senderEmail = configuration["Brevo:SenderEmail"] ?? "abaragithan02@gmail.com";
            _senderName = configuration["Brevo:SenderName"] ?? "Inventory Management System";
        }

        private async Task<string> GetTemplateAsync(string templateName)
        {
            var path = Path.Combine(_webHostEnvironment.ContentRootPath, "EmailTemplates", templateName);
            if (!File.Exists(path))
            {
                // Fallback to AppContext.BaseDirectory (e.g. bin output directory) if template is not found in ContentRootPath
                path = Path.Combine(AppContext.BaseDirectory, "EmailTemplates", templateName);
            }

            if (!File.Exists(path))
            {
                throw new FileNotFoundException($"Email template not found: {templateName} (searched in ContentRootPath and AppContext.BaseDirectory)");
            }

            return await File.ReadAllTextAsync(path);
        }

        public async Task SendEmailAsync(string toEmail, string toName, string subject, string htmlContent)
        {
            // Fallback for development if API key is not provided or looks like placeholder/dev settings
            if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey.Contains("YOUR_API_KEY"))
            {
                _logger.LogInformation("================ MOCK EMAIL SENT ================\n" +
                                     "To: {ToName} <{ToEmail}>\n" +
                                     "Subject: {Subject}\n" +
                                     "Content:\n{HtmlContent}\n" +
                                     "==================================================",
                                     toName, toEmail, subject, htmlContent);
                return;
            }

            try
            {
                var payload = new
                {
                    sender = new { name = _senderName, email = _senderEmail },
                    to = new[] { new { email = toEmail, name = toName } },
                    subject = subject,
                    htmlContent = htmlContent
                };

                var json = JsonSerializer.Serialize(payload);
                using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
                request.Headers.Add("api-key", _apiKey);
                request.Content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Failed to send email to {Email}. Brevo API returned status code {StatusCode}. Error: {Error}", 
                        toEmail, response.StatusCode, errorContent);
                    throw new Exception($"Email sending failed: {response.StatusCode}. {errorContent}");
                }

                _logger.LogInformation("Successfully sent email to {Email} with subject '{Subject}'.", toEmail, subject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred while sending email to {Email}.", toEmail);
                throw;
            }
        }

        public async Task SendEmailVerificationAsync(string email, string verificationLink)
        {
            var subject = "Verify Your Email - Inventory Management System";
            var template = await GetTemplateAsync("EmailVerification.html");
            var htmlContent = template
                .Replace("{VerificationLink}", verificationLink)
                .Replace("{Year}", DateTime.UtcNow.Year.ToString());

            await SendEmailAsync(email, email, subject, htmlContent);
        }

        public async Task SendPurchaseRequestCreatedAsync(string supplierEmail, string supplierName, string requestNumber)
        {
            var subject = $"New Purchase Request Created: {requestNumber}";
            var template = await GetTemplateAsync("PurchaseRequestCreated.html");
            var htmlContent = template
                .Replace("{SupplierName}", supplierName)
                .Replace("{RequestNumber}", requestNumber)
                .Replace("{Year}", DateTime.UtcNow.Year.ToString());

            await SendEmailAsync(supplierEmail, supplierName, subject, htmlContent);
        }

        public async Task SendPurchaseRequestStatusUpdatedAsync(string requesterEmail, string requestNumber, string status, string? notes)
        {
            var subject = $"Purchase Request {requestNumber} Status Updated to {status}";
            var noteSection = string.IsNullOrWhiteSpace(notes) ? "" : $"<p><strong>Supplier/System Notes:</strong> {notes}</p>";
            var statusColor = status.ToLower() switch
            {
                "accepted" => "#10b981",
                "rejected" => "#ef4444",
                "delivered" => "#3b82f6",
                "cancelled" => "#6b7280",
                _ => "#0f172a"
            };

            var template = await GetTemplateAsync("PurchaseRequestStatusUpdated.html");
            var htmlContent = template
                .Replace("{RequestNumber}", requestNumber)
                .Replace("{StatusColor}", statusColor)
                .Replace("{Status}", status)
                .Replace("{NoteSection}", noteSection)
                .Replace("{Year}", DateTime.UtcNow.Year.ToString());

            await SendEmailAsync(requesterEmail, requesterEmail, subject, htmlContent);
        }

        public async Task SendLowStockAlertAsync(string managerEmail, string productName, int currentQty, int reorderLevel)
        {
            var subject = $"CRITICAL ALERT: Low Stock for Product '{productName}'";
            var template = await GetTemplateAsync("LowStockAlert.html");
            var htmlContent = template
                .Replace("{ProductName}", productName)
                .Replace("{CurrentQty}", currentQty.ToString())
                .Replace("{ReorderLevel}", reorderLevel.ToString())
                .Replace("{Year}", DateTime.UtcNow.Year.ToString());

            await SendEmailAsync(managerEmail, managerEmail, subject, htmlContent);
        }

        public async Task SendAccountActivatedAsync(string userEmail, string role)
        {
            var subject = "Account Activated - Inventory Management System";
            var template = await GetTemplateAsync("AccountActivated.html");
            var htmlContent = template
                .Replace("{Role}", role)
                .Replace("{Year}", DateTime.UtcNow.Year.ToString());

            await SendEmailAsync(userEmail, userEmail, subject, htmlContent);
        }

        public async Task SendNewUserWelcomeAsync(string email, string password, string role, string verificationLink)
        {
            var subject = "Welcome to Inventory Management System - Verify Your Account";
            var template = await GetTemplateAsync("NewUserWelcome.html");
            var htmlContent = template
                .Replace("{Email}", email)
                .Replace("{Password}", password)
                .Replace("{Role}", role)
                .Replace("{VerificationLink}", verificationLink)
                .Replace("{Year}", DateTime.UtcNow.Year.ToString());

            await SendEmailAsync(email, email, subject, htmlContent);
        }
    }
}
