using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Application.Catalogos;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartamentosController : ControllerBase
{
    private readonly ICasoUsoListarDepartamentos _casoUso;

    public DepartamentosController(ICasoUsoListarDepartamentos casoUso)
    {
        _casoUso = casoUso;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DepartamentoResponse>>> GetDepartamentos()
    {
        var departamentos = await _casoUso.EjecutarAsync();
        return Ok(departamentos);
    }
}
