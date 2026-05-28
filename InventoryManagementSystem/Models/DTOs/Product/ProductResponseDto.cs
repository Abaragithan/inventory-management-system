namespace InventoryManagementSystem.Models.DTOs.Product
{
    public class ProductResponseDto
    {
        public int ProductId { get; set; }

        public string Barcode { get; set; }
            = string.Empty;

        public string Name { get; set; }
            = string.Empty;

        public string Description { get; set; }
            = string.Empty;

        public decimal Price { get; set; }

        public decimal CostPrice { get; set; }

        public int Quantity { get; set; }

        public int ReorderLevel { get; set; }

        public DateTime CreatedAt { get; set; }

        public int CategoryId { get; set; }

        public string CategoryName { get; set; }
            = string.Empty;

        public int SupplierId { get; set; }

        public string SupplierName { get; set; }
            = string.Empty;
    }
}
