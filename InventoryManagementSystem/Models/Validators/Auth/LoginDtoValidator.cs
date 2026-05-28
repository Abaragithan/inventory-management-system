using FluentValidation;
using InventoryManagementSystem.Models.DTOs.Auth;

namespace InventoryManagementSystem.Models.Validators.Auth;

public class LoginDtoValidator
    : AbstractValidator<LoginDto>
{
    public LoginDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Password)
            .NotEmpty();
    }
}