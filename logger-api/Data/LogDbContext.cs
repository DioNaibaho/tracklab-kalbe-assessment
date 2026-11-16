using logger_api.Models;
using Microsoft.EntityFrameworkCore;

namespace logger_api.Data;

public class LogDbContext : DbContext
{
    public LogDbContext(DbContextOptions<LogDbContext> options) : base(options) { }
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
}
