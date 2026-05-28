namespace InventoryManagementSystem.Models.DTOs.Product
{
    public class CreateProductDto
    {
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

        public int CategoryId { get; set; }

        public int SupplierId { get; set; }
    }
}
