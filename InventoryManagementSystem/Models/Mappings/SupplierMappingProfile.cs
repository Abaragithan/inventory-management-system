using AutoMapper;
using InventoryManagementSystem.Models.DTOs.Supplier;
using InventoryManagementSystem.Models.Entities;

namespace InventoryManagementSystem.Mappings;

public class SupplierMappingProfile : Profile
{
    public SupplierMappingProfile()
    {
        // Entity -> DTO
        CreateMap<Supplier, SupplierResponseDto>()
            .ForMember(dest => dest.IsActive,
                opt => opt.MapFrom(src => src.User != null && src.User.IsActive));

        CreateMap<Supplier, SupplierListDto>()
            .ForMember(dest => dest.IsActive,
                opt => opt.MapFrom(src => src.User != null && src.User.IsActive));

        // Create DTO -> Entity
        CreateMap<CreateSupplierDto, Supplier>()
            .ForMember(dest => dest.UserId,
                opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt,
                opt => opt.Ignore());

        // Update DTO -> Entity
        CreateMap<UpdateSupplierDto, Supplier>()
            .ForMember(dest => dest.SupplierId,
                opt => opt.Ignore())
            .ForMember(dest => dest.UserId,
                opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt,
                opt => opt.Ignore())
            .ForMember(dest => dest.User,
                opt => opt.Ignore());
    }
}