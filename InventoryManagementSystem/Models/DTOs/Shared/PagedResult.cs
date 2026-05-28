namespace InventoryManagementSystem.Models.DTOs.Shared;

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();

    public int TotalCount { get; set; }

    public int Page { get; set; }

    public int PageSize { get; set; }

    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

    /// <summary>
    /// Optional summary counts for the unfiltered dataset
    /// (e.g., "outOfStock": 5, "lowStock": 12).
    /// </summary>
    public Dictionary<string, int>? Summary { get; set; }
}
