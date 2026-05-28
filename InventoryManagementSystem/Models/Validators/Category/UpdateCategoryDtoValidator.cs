using FluentValidation;
using InventoryManagementSystem.Models.DTOs.Category;

namespace InventoryManagementSystem.Models.Validators.Category
{
    public class UpdateCategoryDtoValidator : AbstractValidator<UpdateCategoryDto>
    {
        public UpdateCategoryDtoValidator() {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required.")
                .MaximumLength(100).WithMessage("Name cannot exceed 100 characters.");
            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Description cannot exceed 500 characters.");
        }
    }
}
