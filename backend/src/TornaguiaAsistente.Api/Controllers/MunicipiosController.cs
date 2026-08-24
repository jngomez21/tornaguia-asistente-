using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Application.Catalogos;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MunicipiosController : ControllerBase
{
    private readonly ICasoUsoListarMunicipios _casoUso;

    public MunicipiosController(ICasoUsoListarMunicipios casoUso)
    {
        _casoUso = casoUso;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MunicipioResponse>>> GetMunicipios()
    {
        var municipios = await _casoUso.EjecutarAsync();
        return Ok(municipios);
    }
}
