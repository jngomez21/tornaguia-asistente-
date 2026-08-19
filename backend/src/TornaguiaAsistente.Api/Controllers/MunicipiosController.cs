using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Api.Dtos;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MunicipiosController : ControllerBase
{
    private readonly TornaguiaDbContext _context;

    public MunicipiosController(TornaguiaDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MunicipioDto>>> GetMunicipios()
    {
        var municipios = await _context.Municipios
            .OrderBy(m => m.Nombre)
            .Select(m => new MunicipioDto(m.Id, m.Nombre, m.Departamento.Nombre))
            .ToListAsync();

        return Ok(municipios);
    }
}
