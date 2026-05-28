using AutoMapper;
using InventoryManagementSystem.Models.DTOs.StockTransaction;
using InventoryManagementSystem.Models.Entities;

namespace InventoryManagementSystem.Mappings
{
    public class StockTransactionMappingProfile : Profile
    {
        public StockTransactionMappingProfile()
        {
            CreateMap<StockTransaction, StockTransactionResponseDto>()
                .ForMember(dest => dest.ProductName,
                    opt => opt.MapFrom(src => src.Product.Name))
                .ForMember(dest => dest.UserEmail,
                    opt => opt.MapFrom(src => src.User.Email))
                .ForMember(dest => dest.Type,
                    opt => opt.MapFrom(src => src.Type.ToString()));
        }
    }
}
