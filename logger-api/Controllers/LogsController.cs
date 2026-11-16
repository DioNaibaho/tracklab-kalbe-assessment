using logger_api.Data;
using logger_api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace logger_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LogsController : ControllerBase
{
    private readonly LogDbContext _context;

    public LogsController(LogDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetLogs(
        [FromQuery] string? search,
        [FromQuery] string? module,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 10)
    {
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;

        var query = _context.ActivityLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(module))
            query = query.Where(x => x.Module.ToLower() == module.ToLower());

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.ToLower();
            query = query.Where(x =>
                x.Username.ToLower().Contains(keyword) ||
                x.Action.ToLower().Contains(keyword) ||
                x.Module.ToLower().Contains(keyword) ||
                (x.Details != null && x.Details.ToLower().Contains(keyword)));
        }

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.Timestamp)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return Ok(new
        {
            success = true,
            code = 200,
            message = "OK",
            data = new
            {
                items,
                totalItems,
                page,
                limit,
                totalPages = (int)Math.Ceiling(totalItems / (double)limit)
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateLog([FromBody] ActivityLog log)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { success = false, code = 400, message = "Invalid log payload" });

        log.Id = Guid.NewGuid();
        log.Timestamp = DateTime.UtcNow;

        _context.ActivityLogs.Add(log);
        await _context.SaveChangesAsync();

        return StatusCode(201, new
        {
            success = true,
            code = 201,
            message = "Log recorded",
            data = log
        });
    }
}
