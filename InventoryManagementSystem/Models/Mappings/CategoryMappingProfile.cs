using AutoMapper;
using InventoryManagementSystem.Models.DTOs.Category;
using InventoryManagementSystem.Models.Entities;

namespace InventoryManagementSystem.Mappings;

public class CategoryMappingProfile: Profile
{
    public CategoryMappingProfile()
    {
        // Entity -> Response DTO
        CreateMap<Category, CategoryResponseDto>();

        // Entity -> List DTO
        CreateMap<Category, CategoryListDto>();

        // Create DTO -> Entity
        CreateMap<CreateCategoryDto, Category>()
            .ForMember(dest => dest.CategoryId,
                opt => opt.Ignore());
            //.ForMember(dest => dest.Products,
            //    opt => opt.Ignore());

        // Update DTO -> Entity
        //CreateMap<UpdateCategoryDto, Category>()
        //    .ForMember(dest => dest.Products,
        //        opt => opt.Ignore());
    }
}