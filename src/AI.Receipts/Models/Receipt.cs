using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AI.Receipts.Models;

[Table("Receipt")]
[PrimaryKey(nameof(ReceiptId))]
public class Receipt
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
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
