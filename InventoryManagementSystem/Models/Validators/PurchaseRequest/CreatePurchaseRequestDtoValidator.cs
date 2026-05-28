using FluentValidation;
using InventoryManagementSystem.Models.DTOs.PurchaseRequest;

namespace InventoryManagementSystem.Models.Validators.PurchaseRequest
{
    public class CreatePurchaseRequestDtoValidator : AbstractValidator<CreatePurchaseRequestDto>
    {
        public CreatePurchaseRequestDtoValidator()
        {
            RuleFor(x => x.SupplierId)
                .GreaterThan(0)
                .WithMessage("Supplier is required.");

            RuleFor(x => x.PurchaseRequestItems)
                .NotEmpty()
                .WithMessage("Purchase request must contain at least one item.");

            RuleForEach(x => x.PurchaseRequestItems)
                .SetValidator(new CreatePurchaseRequestItemDtoValidator());
        }
    }

    public class CreatePurchaseRequestItemDtoValidator : AbstractValidator<CreatePurchaseRequestItemDto>
    {
        public CreatePurchaseRequestItemDtoValidator()
        {
            RuleFor(x => x.ProductId)
                .GreaterThan(0)
                .WithMessage("Product is required.");

            RuleFor(x => x.RequestedQuantity)
                .GreaterThan(0)
                .WithMessage("Quantity must be greater than 0.");

            RuleFor(x => x.UnitCost)
                .GreaterThan(0)
                .WithMessage("Unit cost must be greater than 0.");
        }
    }
}
