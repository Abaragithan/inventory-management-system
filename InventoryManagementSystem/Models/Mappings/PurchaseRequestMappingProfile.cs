using AutoMapper;
using InventoryManagementSystem.Models.DTOs.PurchaseRequest;
using InventoryManagementSystem.Models.Entities;

namespace InventoryManagementSystem.Mappings
{
    public class PurchaseRequestMappingProfile : Profile
    {
        public PurchaseRequestMappingProfile()
        {
            CreateMap<PurchaseRequest, PurchaseRequestResponseDto>()
                .ForMember(dest => dest.SupplierCompanyName, opt => opt.MapFrom(src => src.Supplier.CompanyName))
                .ForMember(dest => dest.RequestedByUserEmail, opt => opt.MapFrom(src => src.RequestedByUser.Email))
                .ForMember(dest => dest.PurchaseRequestItems, opt => opt.MapFrom(src => src.PurchaseRequestItems));

            CreateMap<PurchaseRequestItem, PurchaseRequestItemResponseDto>()
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product.Name))
                .ForMember(dest => dest.ProductBarcode, opt => opt.MapFrom(src => src.Product.Barcode));

            CreateMap<CreatePurchaseRequestDto, PurchaseRequest>()
                .ForMember(dest => dest.PurchaseRequestItems, opt => opt.MapFrom(src => src.PurchaseRequestItems))
                .ForMember(dest => dest.RequestId, opt => opt.Ignore())
                .ForMember(dest => dest.RequestNumber, opt => opt.Ignore())
                .ForMember(dest => dest.RequestStatus, opt => opt.Ignore())
                .ForMember(dest => dest.RequestedDate, opt => opt.Ignore())
                .ForMember(dest => dest.DeliveredDate, opt => opt.Ignore())
                .ForMember(dest => dest.IsActive, opt => opt.Ignore())
                .ForMember(dest => dest.Supplier, opt => opt.Ignore())
                .ForMember(dest => dest.RequestedByUser, opt => opt.Ignore());

            CreateMap<CreatePurchaseRequestItemDto, PurchaseRequestItem>()
                .ForMember(dest => dest.RequestItemId, opt => opt.Ignore())
                .ForMember(dest => dest.RequestId, opt => opt.Ignore())
                .ForMember(dest => dest.DeliveredQuantity, opt => opt.Ignore())
                .ForMember(dest => dest.IsReceived, opt => opt.Ignore())
                .ForMember(dest => dest.PurchaseRequest, opt => opt.Ignore())
                .ForMember(dest => dest.Product, opt => opt.Ignore());
        }
    }
}
