namespace InventoryManagementSystem.Models.DTOs.Supplier
{
    public class SupplierListDto
    {
        public int SupplierId { get; set; }

        public string CompanyName { get; set; }
            = string.Empty;

        public string ContactPerson { get; set; }
            = string.Empty;

        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
