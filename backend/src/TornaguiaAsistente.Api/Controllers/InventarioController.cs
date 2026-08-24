using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Application.Inventario;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("fixed")]
[Authorize]
public class InventarioController : ApiControllerBase
{
    private readonly ICasoUsoObtenerInventario _casoUsoObtenerInventario;
    private readonly ICasoUsoRegistrarEntrada _casoUsoRegistrarEntrada;
    private readonly ICasoUsoListarLotesDisponibles _casoUsoListarLotesDisponibles;
    private readonly ICasoUsoCrearLote _casoUsoCrearLote;
    private readonly ICasoUsoEditarLote _casoUsoEditarLote;
    private readonly ICasoUsoCancelarLote _casoUsoCancelarLote;
    private readonly ICasoUsoDeshacerUltimaEntrada _casoUsoDeshacerUltimaEntrada;

    public InventarioController(
        ICasoUsoObtenerInventario casoUsoObtenerInventario,
        ICasoUsoRegistrarEntrada casoUsoRegistrarEntrada,
        ICasoUsoListarLotesDisponibles casoUsoListarLotesDisponibles,
        ICasoUsoCrearLote casoUsoCrearLote,
        ICasoUsoEditarLote casoUsoEditarLote,
        ICasoUsoCancelarLote casoUsoCancelarLote,
        ICasoUsoDeshacerUltimaEntrada casoUsoDeshacerUltimaEntrada)
    {
        _casoUsoObtenerInventario = casoUsoObtenerInventario;
        _casoUsoRegistrarEntrada = casoUsoRegistrarEntrada;
        _casoUsoListarLotesDisponibles = casoUsoListarLotesDisponibles;
        _casoUsoCrearLote = casoUsoCrearLote;
        _casoUsoEditarLote = casoUsoEditarLote;
        _casoUsoCancelarLote = casoUsoCancelarLote;
        _casoUsoDeshacerUltimaEntrada = casoUsoDeshacerUltimaEntrada;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<InventarioItemResponse>>> Obtener()
    {
        var resultado = await _casoUsoObtenerInventario.EjecutarAsync(UsuarioId);
        return Ok(resultado);
    }

    [HttpPost("entradas")]
    public async Task<ActionResult<InventarioItemResponse>> RegistrarEntrada(RegistrarEntradaRequest request)
    {
        var requestConUsuarioReal = request with { UsuarioId = UsuarioId };

        try
        {
            var resultado = await _casoUsoRegistrarEntrada.EjecutarAsync(requestConUsuarioReal);
            return Ok(resultado);
        }
        catch (InventarioInvalidoException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPost("entradas/{productoId}/deshacer")]
    public async Task<ActionResult<InventarioItemResponse>> DeshacerUltimaEntrada(int productoId)
    {
        try
        {
            var resultado = await _casoUsoDeshacerUltimaEntrada.EjecutarAsync(
                new DeshacerUltimaEntradaRequest(UsuarioId, productoId));
            return Ok(resultado);
        }
        catch (InventarioInvalidoException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpGet("lotes")]
    public async Task<ActionResult<IReadOnlyList<LoteResponse>>> ListarLotesDisponibles()
    {
        var resultado = await _casoUsoListarLotesDisponibles.EjecutarAsync(UsuarioId);
        return Ok(resultado);
    }

    [HttpPost("lotes")]
    public async Task<ActionResult<LoteResponse>> CrearLote(CrearLoteRequest request)
    {
        var requestConUsuarioReal = request with { UsuarioId = UsuarioId };

        try
        {
            var resultado = await _casoUsoCrearLote.EjecutarAsync(requestConUsuarioReal);
            return Ok(resultado);
        }
        catch (InventarioInvalidoException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPut("lotes/{id}")]
    public async Task<ActionResult<LoteResponse>> EditarLote(int id, EditarLoteRequest request)
    {
        var requestConDatosReales = request with { LoteId = id, UsuarioId = UsuarioId };

        try
        {
            var resultado = await _casoUsoEditarLote.EjecutarAsync(requestConDatosReales);
            return Ok(resultado);
        }
        catch (InventarioInvalidoException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPost("lotes/{id}/cancelar")]
    public async Task<IActionResult> CancelarLote(int id)
    {
        try
        {
            await _casoUsoCancelarLote.EjecutarAsync(new CancelarLoteRequest(id, UsuarioId));
            return NoContent();
        }
        catch (InventarioInvalidoException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}
