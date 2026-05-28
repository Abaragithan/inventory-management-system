namespace InventoryManagementSystem.Models.DTOs.Supplier
{
    public class CreateSupplierDto
    {
        public int UserId { get; set; }
        public string CompanyName { get; set; }
        = string.Empty;

        public string ContactPerson { get; set; }
            = string.Empty;

        public string Email { get; set; }
            = string.Empty;

        public string Phone { get; set; }
            = string.Empty;

        public string Address { get; set; }
            = string.Empty;
    }
}
