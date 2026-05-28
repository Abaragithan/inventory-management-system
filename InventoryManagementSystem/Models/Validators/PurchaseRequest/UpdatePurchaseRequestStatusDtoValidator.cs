using FluentValidation;
using InventoryManagementSystem.Models.DTOs.PurchaseRequest;

namespace InventoryManagementSystem.Models.Validators.PurchaseRequest
{
    public class UpdatePurchaseRequestStatusDtoValidator : AbstractValidator<UpdatePurchaseRequestStatusDto>
    {
        public UpdatePurchaseRequestStatusDtoValidator()
        {
            RuleFor(x => x.RequestStatus)
                .IsInEnum().WithMessage("Invalid request status.");

            RuleFor(x => x.Notes)
                .MaximumLength(500).WithMessage("Notes cannot exceed 500 characters.");
        }
    }
}
