using Microsoft.EntityFrameworkCore;

namespace AI.Receipts.Data;

public class AiReceiptsDbContext(DbContextOptions<AiReceiptsDbContext> options) : DbContext(options)
{
    public DbSet<Models.Receipt> Receipts => Set<Models.Receipt>();
    public DbSet<Models.Category> Categories => Set<Models.Category>();
}
