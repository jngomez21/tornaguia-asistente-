using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Application.Bodegas;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("fixed")]
[Authorize]
public class BodegasController : ApiControllerBase
{
    private readonly ICasoUsoListarBodegas _casoUsoListar;
    private readonly ICasoUsoCrearBodega _casoUsoCrear;
    private readonly ICasoUsoEditarBodega _casoUsoEditar;
    private readonly ICasoUsoEliminarBodega _casoUsoEliminar;

    public BodegasController(
        ICasoUsoListarBodegas casoUsoListar,
        ICasoUsoCrearBodega casoUsoCrear,
        ICasoUsoEditarBodega casoUsoEditar,
        ICasoUsoEliminarBodega casoUsoEliminar)
    {
        _casoUsoListar = casoUsoListar;
        _casoUsoCrear = casoUsoCrear;
        _casoUsoEditar = casoUsoEditar;
        _casoUsoEliminar = casoUsoEliminar;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BodegaResponse>>> Listar()
    {
        var resultado = await _casoUsoListar.EjecutarAsync(UsuarioId);
        return Ok(resultado);
    }

    [HttpPost]
    public async Task<ActionResult<BodegaResponse>> Crear(CrearBodegaRequest request)
    {
        var requestConUsuarioReal = request with { UsuarioId = UsuarioId };

        try
        {
            var resultado = await _casoUsoCrear.EjecutarAsync(requestConUsuarioReal);
            return Ok(resultado);
        }
        catch (BodegaInvalidaException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BodegaResponse>> Editar(int id, EditarBodegaRequest request)
    {
        var requestConDatosReales = request with { BodegaId = id, UsuarioId = UsuarioId };

        try
        {
            var resultado = await _casoUsoEditar.EjecutarAsync(requestConDatosReales);
            return Ok(resultado);
        }
        catch (BodegaInvalidaException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        try
        {
            await _casoUsoEliminar.EjecutarAsync(new EliminarBodegaRequest(id, UsuarioId));
            return NoContent();
        }
        catch (BodegaInvalidaException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}
