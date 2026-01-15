using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AI.Receipts.Models;

[Table("Category")]
public class Receipt
{
    [Key]
    public int ReceiptId { get; set; }

    [Required]
    [MaxLength(4096)]
    public string ExtractedText { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = null!;

    [Required]
    [MaxLength(4096)]
    public string Description { get; set; } = null!;

    [MaxLength(100)]
    [Required]
    public string Vendor { get; set; } = null!;

    [MaxLength(100)]
    [Required]
    public string State { get; set; } = null!;

    [MaxLength(100)]
    [Required]
    public string City { get; set; } = null!;

    [MaxLength(100)]
    [Required]
    public string Country { get; set; } = null!;

    [MaxLength(500)]
    [Required]
    public string ImageUrl { get; set; } = null!;

    [Range(1, int.MaxValue)]
    public decimal Amount { get; set; }

    [Range(1, int.MaxValue)]
    public decimal Tax { get; set; }

    [Range(1, int.MaxValue)]
    public decimal Total { get; set; }

    public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public int CategoryId { get; set; }

    [ForeignKey("CategoryId")]
    public Category Category { get; set; } = null!;
}

public class ReceiptDto
{
    public int ReceiptId { get; set; }

    [Required]
    [MaxLength(4096)]
    public string ExtractedText { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = null!;

    [Required]
    [MaxLength(4096)]
    public string Description { get; set; } = null!;

    [MaxLength(100)]
    [Required]
    public string Vendor { get; set; } = null!;

    [MaxLength(100)]
    [Required]
    public string State { get; set; } = null!;

    [MaxLength(100)]
    [Required]
    public string City { get; set; } = null!;

    [MaxLength(100)]
    [Required]
    public string Country { get; set; } = null!;

    [MaxLength(500)]
    [Required]
    public string ImageUrl { get; set; } = null!;

    [Range(1, int.MaxValue)]
    public decimal Amount { get; set; }

    [Range(1, int.MaxValue)]
    public decimal Tax { get; set; }

    [Range(1, int.MaxValue)]
    public decimal Total { get; set; }

    public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public int CategoryId { get; set; }

    [ForeignKey("CategoryId")]
    public Category Category { get; set; } = null!;

    public static implicit operator ReceiptDto(Receipt receipt) =>
        new()
        {
            ReceiptId = receipt.ReceiptId,
            ExtractedText = receipt.ExtractedText,
            Title = receipt.Title,
            Description = receipt.Description,
            Vendor = receipt.Vendor,
            State = receipt.State,
            City = receipt.City,
            Country = receipt.Country,
            ImageUrl = receipt.ImageUrl,
            Amount = receipt.Amount,
            Tax = receipt.Tax,
            Total = receipt.Total,
            PurchaseDate = receipt.PurchaseDate,
            CreatedAt = receipt.CreatedAt,
            UpdatedAt = receipt.UpdatedAt,
            CategoryId = receipt.CategoryId,
            Category = receipt.Category
        };

    public static implicit operator Receipt(ReceiptDto receiptDto) =>
        new()
        {
            ReceiptId = receiptDto.ReceiptId,
            ExtractedText = receiptDto.ExtractedText,
            Title = receiptDto.Title,
            Description = receiptDto.Description,
            Vendor = receiptDto.Vendor,
            State = receiptDto.State,
            City = receiptDto.City,
            Country = receiptDto.Country,
            ImageUrl = receiptDto.ImageUrl,
            Amount = receiptDto.Amount,
            Tax = receiptDto.Tax,
            Total = receiptDto.Total,
            PurchaseDate = receiptDto.PurchaseDate,
            CreatedAt = receiptDto.CreatedAt,
            UpdatedAt = receiptDto.UpdatedAt,
            CategoryId = receiptDto.CategoryId,
            Category = receiptDto.Category
        };
}
