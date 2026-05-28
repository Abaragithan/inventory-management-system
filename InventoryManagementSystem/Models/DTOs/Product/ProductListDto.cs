namespace InventoryManagementSystem.Models.DTOs.Product
{
    public class ProductListDto
    {
        public int ProductId { get; set; }

        public string Barcode { get; set; }
            = string.Empty;

        public string Name { get; set; }
            = string.Empty;

        public decimal Price { get; set; }

        public int Quantity { get; set; }

        public string CategoryName { get; set; }
            = string.Empty;

        public string SupplierName { get; set; }
            = string.Empty;

        public int ReorderLevel { get; set; }
    }
}
