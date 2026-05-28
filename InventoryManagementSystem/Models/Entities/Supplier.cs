namespace InventoryManagementSystem.Models.Entities;

public class Supplier
{
    public int SupplierId { get; set; }

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



    public DateTime CreatedAt { get; set; }
        = DateTime.UtcNow;


    // Navigation Property
    public User User { get; set; } = null!;
}