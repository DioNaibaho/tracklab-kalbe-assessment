using System.ComponentModel.DataAnnotations;

namespace logger_api.Models;

public class ActivityLog
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [Required, MaxLength(100)]
    public string Username { get; set; } = "anonymous";

    [Required, MaxLength(50)]
    public string Action { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Module { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Endpoint { get; set; }
    public string? Details { get; set; }
    public int StatusCode { get; set; } = 200;
}
