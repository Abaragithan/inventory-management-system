using FluentValidation;
using InventoryManagementSystem.Enums;
using InventoryManagementSystem.Models.DTOs.StockTransaction;

namespace InventoryManagementSystem.Models.Validators.StockTransaction;

public class CreateStockTransactionDtoValidator
    : AbstractValidator<CreateStockTransactionDto>
{
    public CreateStockTransactionDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0)
            .WithMessage("A valid product must be selected.");

        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("Transaction type must be one of: StockIn, StockOut, Adjustment, Return.");

        RuleFor(x => x.Quantity)
            .NotEqual(0)
            .When(x => x.Type == StockTransactionType.Adjustment)
            .WithMessage("Adjustment quantity cannot be zero.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0)
            .When(x => x.Type != StockTransactionType.Adjustment)
            .WithMessage("Quantity must be greater than zero.");

        RuleFor(x => x.Notes)
            .MaximumLength(500)
            .WithMessage("Notes cannot exceed 500 characters.")
            .When(x => x.Notes != null);
    }
}
