using FluentValidation;
using InventoryManagementSystem.Models.DTOs.Product;

namespace InventoryManagementSystem.Models.Validators.Product;

public class UpdateProductDtoValidator
    : AbstractValidator<UpdateProductDto>
{
    public UpdateProductDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product Name is required.")
            .MaximumLength(200).WithMessage("Product Name cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Sale Price must be greater than 0.");

        RuleFor(x => x.CostPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Cost Price cannot be negative.");

        RuleFor(x => x.ReorderLevel)
            .GreaterThanOrEqualTo(0).WithMessage("Reorder Level cannot be negative.");

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Please select a valid Category.");

        RuleFor(x => x.SupplierId)
            .GreaterThan(0).WithMessage("Please select a valid Supplier.");
    }
}