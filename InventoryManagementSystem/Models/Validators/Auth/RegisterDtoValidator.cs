using FluentValidation;
using InventoryManagementSystem.Models.DTOs.Auth;

namespace InventoryManagementSystem.Models.Validators.Auth;

public class RegisterDtoValidator
    : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(100);

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(6)
            .MaximumLength(100);

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password)
            .WithMessage(
                "Passwords do not match");
    }
}