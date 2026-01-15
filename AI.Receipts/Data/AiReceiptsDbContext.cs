using AI.Receipts.Models;
using Microsoft.EntityFrameworkCore;

namespace AI.Receipts.Data;

public class AiReceiptsDbContext(DbContextOptions<AiReceiptsDbContext> options) : DbContext(options)
{
    public DbSet<Receipt> Receipts { get; set; }
    public DbSet<Category> Categories { get; set; }
}
