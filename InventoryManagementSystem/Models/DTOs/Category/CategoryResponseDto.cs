namespace InventoryManagementSystem.Models.DTOs.Category
{
    public class CategoryResponseDto
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

    }
}
