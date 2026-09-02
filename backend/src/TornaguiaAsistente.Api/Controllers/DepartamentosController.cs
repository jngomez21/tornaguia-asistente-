using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Application.Catalogos;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartamentosController : ControllerBase
{
    private readonly ICasoUsoListarDepartamentos _casoUso;
    private readonly ICasoUsoObtenerLimitesDepartamentos _casoUsoLimites;

    public DepartamentosController(
        ICasoUsoListarDepartamentos casoUso,
        ICasoUsoObtenerLimitesDepartamentos casoUsoLimites)
    {
        _casoUso = casoUso;
        _casoUsoLimites = casoUsoLimites;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DepartamentoResponse>>> GetDepartamentos()
    {
        var departamentos = await _casoUso.EjecutarAsync();
        return Ok(departamentos);
    }

    [HttpGet("limites")]
    public async Task<ActionResult<IReadOnlyList<DepartamentoLimitesResponse>>> GetLimites(
        [FromQuery] string ids, CancellationToken cancellationToken)
    {
        var departamentoIds = ids
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(int.Parse)
            .ToList();

        var limites = await _casoUsoLimites.EjecutarAsync(departamentoIds, cancellationToken);
        return Ok(limites);
    }
}
