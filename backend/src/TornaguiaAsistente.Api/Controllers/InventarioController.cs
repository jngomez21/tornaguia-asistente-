using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Application.Ia;
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
    private readonly ICasoUsoEditarInventario _casoUsoEditarInventario;
    private readonly ICasoUsoProponerDeclaracion _casoUsoProponerDeclaracion;
    private readonly ICasoUsoCrearLoteDesdeDeclaracion _casoUsoCrearLoteDesdeDeclaracion;

    public InventarioController(
        ICasoUsoObtenerInventario casoUsoObtenerInventario,
        ICasoUsoRegistrarEntrada casoUsoRegistrarEntrada,
        ICasoUsoListarLotesDisponibles casoUsoListarLotesDisponibles,
        ICasoUsoCrearLote casoUsoCrearLote,
        ICasoUsoEditarLote casoUsoEditarLote,
        ICasoUsoCancelarLote casoUsoCancelarLote,
        ICasoUsoEditarInventario casoUsoEditarInventario,
        ICasoUsoProponerDeclaracion casoUsoProponerDeclaracion,
        ICasoUsoCrearLoteDesdeDeclaracion casoUsoCrearLoteDesdeDeclaracion)
    {
        _casoUsoObtenerInventario = casoUsoObtenerInventario;
        _casoUsoRegistrarEntrada = casoUsoRegistrarEntrada;
        _casoUsoListarLotesDisponibles = casoUsoListarLotesDisponibles;
        _casoUsoCrearLote = casoUsoCrearLote;
        _casoUsoEditarLote = casoUsoEditarLote;
        _casoUsoCancelarLote = casoUsoCancelarLote;
        _casoUsoEditarInventario = casoUsoEditarInventario;
        _casoUsoProponerDeclaracion = casoUsoProponerDeclaracion;
        _casoUsoCrearLoteDesdeDeclaracion = casoUsoCrearLoteDesdeDeclaracion;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<InventarioItemResponse>>> Obtener([FromQuery] int bodegaId)
    {
        try
        {
            var resultado = await _casoUsoObtenerInventario.EjecutarAsync(bodegaId, UsuarioId);
            return Ok(resultado);
        }
        catch (InventarioInvalidoException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
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

    [HttpPut("{productoId}")]
    public async Task<ActionResult<InventarioItemResponse>> EditarInventario(int productoId, EditarInventarioRequest request)
    {
        var requestConDatosReales = request with { ProductoId = productoId, UsuarioId = UsuarioId };

        try
        {
            var resultado = await _casoUsoEditarInventario.EjecutarAsync(requestConDatosReales);
            return Ok(resultado);
        }
        catch (InventarioInvalidoException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpGet("lotes")]
    public async Task<ActionResult<IReadOnlyList<LoteResponse>>> ListarLotesDisponibles([FromQuery] int? bodegaId)
    {
        var resultado = await _casoUsoListarLotesDisponibles.EjecutarAsync(UsuarioId, bodegaId);
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

    [HttpPost("lotes/declaraciones/proponer")]
    public async Task<ActionResult<PropuestaDeclaracionResponse>> ProponerDeclaracion(ProponerDeclaracionRequest request)
    {
        try
        {
            var resultado = await _casoUsoProponerDeclaracion.EjecutarAsync(request);
            return Ok(resultado);
        }
        catch (ExtraccionDeclaracionException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPost("lotes/desde-declaracion")]
    public async Task<ActionResult<LoteResponse>> CrearLoteDesdeDeclaracion(CrearLoteDesdeDeclaracionRequest request)
    {
        var requestConUsuarioReal = request with { UsuarioId = UsuarioId };

        try
        {
            var resultado = await _casoUsoCrearLoteDesdeDeclaracion.EjecutarAsync(requestConUsuarioReal);
            return Ok(resultado);
        }
        catch (InventarioInvalidoException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}
