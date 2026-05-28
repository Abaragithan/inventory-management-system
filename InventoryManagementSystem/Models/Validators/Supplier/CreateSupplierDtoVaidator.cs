using FluentValidation;
using InventoryManagementSystem.Models.DTOs.Supplier;

namespace InventoryManagementSystem.Models.Validators.Supplier;

public class CreateSupplierDtoValidator
    : AbstractValidator<CreateSupplierDto>
{
    public CreateSupplierDtoValidator()
    {
        RuleFor(x => x.CompanyName)
            .NotEmpty().WithMessage("Company Name is required.")
            .MaximumLength(200).WithMessage("Company Name cannot exceed 200 characters.");

        RuleFor(x => x.ContactPerson)
            .NotEmpty().WithMessage("Contact Person is required.")
            .MaximumLength(200).WithMessage("Contact Person Name cannot exceed 200 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Contact Email is required.")
            .EmailAddress().WithMessage("Please enter a valid email address.")
            .MaximumLength(100).WithMessage("Email address cannot exceed 100 characters.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required.")
            .MaximumLength(20).WithMessage("Phone number cannot exceed 20 characters.");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Address is required.")
            .MaximumLength(500).WithMessage("Address cannot exceed 500 characters.");
    }
}