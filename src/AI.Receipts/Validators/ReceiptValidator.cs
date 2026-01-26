using AI.Receipts.Models;
using FluentValidation;

namespace AI.Receipts.Validators;

public class ReceiptValidator : AbstractValidator<Receipt>
{
    public ReceiptValidator()
    {
        RuleFor(r => r.ReceiptId).NotEmpty();
        RuleFor(r => r.CategoryId).NotEmpty();
        RuleFor(r => r.ImageUrl).NotEmpty();
        RuleFor(r => r.PurchaseDate).LessThanOrEqualTo(DateTime.Now);
        RuleFor(r => r.Total).GreaterThan(0);
    }
}
