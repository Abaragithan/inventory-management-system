using FluentValidation;
using InventoryManagementSystem.Models.DTOs.User;

namespace InventoryManagementSystem.Models.Validators.User;

public class CreateUserDtoValidator
    : AbstractValidator<CreateUserDto>
{
    public CreateUserDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Please enter a valid email address.")
            .MaximumLength(100).WithMessage("Email cannot exceed 100 characters.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters.")
            .MaximumLength(100).WithMessage("Password cannot exceed 100 characters.");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password)
            .WithMessage(
                "Passwords do not match");

        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(role =>
                role == "Admin" ||
                role == "InventoryManager" ||
                role == "Supplier" ||
                role == "Staff")
            .WithMessage(
                "Role must be one of: Admin, InventoryManager, Supplier, Staff");
    }
}