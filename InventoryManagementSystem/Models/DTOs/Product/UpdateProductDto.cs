namespace InventoryManagementSystem.Models.DTOs.Product
{
    public class UpdateProductDto
    {
        public string Name { get; set; }
         = string.Empty;

        public string Description { get; set; }
            = string.Empty;

        public decimal Price { get; set; }

        public decimal CostPrice { get; set; }

        public int ReorderLevel { get; set; }

        public int CategoryId { get; set; }

        public int SupplierId { get; set; }

    }
}
