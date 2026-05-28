using AutoMapper;
using InventoryManagementSystem.Models.DTOs.Product;

namespace InventoryManagementSystem.Mappings;

public class ProductMappingProfile : Profile
{
    public ProductMappingProfile()
    {
        // Entity -> Response DTO
        CreateMap<Product, ProductResponseDto>()
            .ForMember(dest => dest.CategoryName,
                opt => opt.MapFrom(src => src.Category.Name))
            .ForMember(dest => dest.SupplierName,
                opt => opt.MapFrom(src => src.Supplier.CompanyName));

        // Entity -> List DTO
        CreateMap<Product, ProductListDto>()
            .ForMember(dest => dest.CategoryName,
                opt => opt.MapFrom(src => src.Category.Name))
            .ForMember(dest => dest.Name,
                opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.SupplierName,
                opt => opt.MapFrom(src => src.Supplier.CompanyName));

        // Create DTO -> Entity
        CreateMap<CreateProductDto, Product>()
            .ForMember(dest => dest.ProductId,
                opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt,
                opt => opt.Ignore())
            .ForMember(dest => dest.Category,
                opt => opt.Ignore())
            .ForMember(dest => dest.Supplier,
                opt => opt.Ignore())
            .ForMember(dest => dest.StockTransactions,
                opt => opt.Ignore());

        // Update DTO -> Entity
        CreateMap<UpdateProductDto, Product>()
            .ForMember(dest => dest.CreatedAt,
                opt => opt.Ignore())
            .ForMember(dest => dest.Category,
                opt => opt.Ignore())
            .ForMember(dest => dest.Supplier,
                opt => opt.Ignore())
            .ForMember(dest => dest.StockTransactions,
                opt => opt.Ignore());
    }
}