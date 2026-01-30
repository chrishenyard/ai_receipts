using AI.Receipts.Models;
using FluentValidation;

namespace AI.Receipts.Validators;

public class ReceiptValidator : AbstractValidator<Receipt>
{
    public ReceiptValidator()
    {
        RuleFor(r => r.ExtractedText).NotEmpty().MaximumLength(4096);
        RuleFor(r => r.Title).NotEmpty().MaximumLength(100);
        RuleFor(r => r.Description).NotEmpty().MaximumLength(4096);
        RuleFor(r => r.Vendor).NotEmpty().MaximumLength(100);
        RuleFor(r => r.State).NotEmpty().MaximumLength(100);
        RuleFor(r => r.City).NotEmpty().MaximumLength(100);
        RuleFor(r => r.Country).NotEmpty().MaximumLength(100);
        RuleFor(r => r.ImageUrl).NotEmpty().MaximumLength(500);
        RuleFor(r => r.ReceiptId).NotEmpty();
        RuleFor(r => r.CategoryId).NotEmpty();
        RuleFor(r => r.PurchaseDate).LessThanOrEqualTo(DateTime.Now);
        RuleFor(r => r.Total).GreaterThan(0);
    }
}
