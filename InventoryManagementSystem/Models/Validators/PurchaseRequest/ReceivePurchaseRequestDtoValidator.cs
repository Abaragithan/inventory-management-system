using FluentValidation;
using InventoryManagementSystem.Models.DTOs.PurchaseRequest;

namespace InventoryManagementSystem.Models.Validators.PurchaseRequest
{
    public class ReceivePurchaseRequestDtoValidator : AbstractValidator<ReceivePurchaseRequestDto>
    {
        public ReceivePurchaseRequestDtoValidator()
        {
            RuleFor(x => x.Items)
                .NotEmpty()
                .WithMessage("At least one received item details must be provided.");

            RuleForEach(x => x.Items)
                .SetValidator(new ReceivePurchaseRequestItemDtoValidator());
        }
    }

    public class ReceivePurchaseRequestItemDtoValidator : AbstractValidator<ReceivePurchaseRequestItemDto>
    {
        public ReceivePurchaseRequestItemDtoValidator()
        {
            RuleFor(x => x.RequestItemId)
                .GreaterThan(0)
                .WithMessage("Valid RequestItemId is required.");

            RuleFor(x => x.DeliveredQuantity)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Delivered quantity must be greater than or equal to 0.");
        }
    }
}
