using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Api.Dtos;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaisesController : ControllerBase
{
    private readonly TornaguiaDbContext _context;

    public PaisesController(TornaguiaDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PaisDto>>> GetPaises()
    {
        var paises = await _context.Paises
            .OrderBy(p => p.Nombre)
            .Select(p => new PaisDto(p.Id, p.Nombre, p.CodigoISO))
            .ToListAsync();

        return Ok(paises);
    }
}
