using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AI.Receipts.Models;

[Table("Category")]
[PrimaryKey(nameof(CategoryId))]
public class Category
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int CategoryId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;
}
