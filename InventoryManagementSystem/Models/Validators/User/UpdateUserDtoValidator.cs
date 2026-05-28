using FluentValidation;
using InventoryManagementSystem.Models.DTOs.User;

namespace InventoryManagementSystem.Models.Validators.User;

public class UpdateUserDtoValidator
    : AbstractValidator<UpdateUserDto>
{
    public UpdateUserDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Please enter a valid email address.")
            .MaximumLength(100).WithMessage("Email cannot exceed 100 characters.");

        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(role =>
                role == "Admin" ||
                role == "InventoryManager" ||
                role == "Supplier" ||
                role == "Staff")
            .WithMessage(
                "Role must be one of: Admin, InventoryManager, Supplier, Staff");

        RuleFor(x => x.IsActive)
            .NotNull();
    }
}