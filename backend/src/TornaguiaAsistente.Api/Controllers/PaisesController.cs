using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Application.Catalogos;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaisesController : ControllerBase
{
    private readonly ICasoUsoListarPaises _casoUso;

    public PaisesController(ICasoUsoListarPaises casoUso)
    {
        _casoUso = casoUso;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PaisResponse>>> GetPaises()
    {
        var paises = await _casoUso.EjecutarAsync();
        return Ok(paises);
    }
}
