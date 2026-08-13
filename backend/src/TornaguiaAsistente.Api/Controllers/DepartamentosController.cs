using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Api.Dtos;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartamentosController : ControllerBase
{
    private readonly TornaguiaDbContext _context;

    public DepartamentosController(TornaguiaDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DepartamentoDto>>> GetDepartamentos()
    {
        var departamentos = await _context.Departamentos
            .OrderBy(d => d.Nombre)
            .Select(d => new DepartamentoDto(d.Id, d.Nombre, d.CodigoDane))
            .ToListAsync();

        return Ok(departamentos);
    }
}