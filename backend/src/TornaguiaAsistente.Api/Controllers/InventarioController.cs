using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Application.Inventario;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("fixed")]
[Authorize]
public class InventarioController : ControllerBase
{
    private readonly ICasoUsoObtenerInventario _casoUsoObtenerInventario;
    private readonly ICasoUsoRegistrarEntrada _casoUsoRegistrarEntrada;
    private readonly ICasoUsoListarLotesDisponibles _casoUsoListarLotesDisponibles;
    private readonly ICasoUsoCrearLote _casoUsoCrearLote;
    private readonly ICasoUsoEditarLote _casoUsoEditarLote;
    private readonly ICasoUsoCancelarLote _casoUsoCancelarLote;

    public InventarioController(
        ICasoUsoObtenerInventario casoUsoObtenerInventario,
        ICasoUsoRegistrarEntrada casoUsoRegistrarEntrada,
        ICasoUsoListarLotesDisponibles casoUsoListarLotesDisponibles,
        ICasoUsoCrearLote casoUsoCrearLote,
        ICasoUsoEditarLote casoUsoEditarLote,
        ICasoUsoCancelarLote casoUsoCancelarLote)
    {
        _casoUsoObtenerInventario = casoUsoObtenerInventario;
        _casoUsoRegistrarEntrada = casoUsoRegistrarEntrada;
        _casoUsoListarLotesDisponibles = casoUsoListarLotesDisponibles;
        _casoUsoCrearLote = casoUsoCrearLote;
        _casoUsoEditarLote = casoUsoEditarLote;
        _casoUsoCancelarLote = casoUsoCancelarLote;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<InventarioItemResponse>>> Obtener()
    {
        var usuarioId = ObtenerUsuarioId();
        if (usuarioId is null)
            return Unauthorized();

        var resultado = await _casoUsoObtenerInventario.EjecutarAsync(usuarioId.Value);
        return Ok(resultado);
    }

    [HttpPost("entradas")]
    public async Task<ActionResult<InventarioItemResponse>> RegistrarEntrada(RegistrarEntradaRequest request)
    {
        var usuarioId = ObtenerUsuarioId();
        if (usuarioId is null)
            return Unauthorized();

        var requestConUsuarioReal = request with { UsuarioId = usuarioId.Value };

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

    [HttpGet("lotes")]
    public async Task<ActionResult<IReadOnlyList<LoteResponse>>> ListarLotesDisponibles()
    {
        var usuarioId = ObtenerUsuarioId();
        if (usuarioId is null)
            return Unauthorized();

        var resultado = await _casoUsoListarLotesDisponibles.EjecutarAsync(usuarioId.Value);
        return Ok(resultado);
    }

    [HttpPost("lotes")]
    public async Task<ActionResult<LoteResponse>> CrearLote(CrearLoteRequest request)
    {
        var usuarioId = ObtenerUsuarioId();
        if (usuarioId is null)
            return Unauthorized();

        var requestConUsuarioReal = request with { UsuarioId = usuarioId.Value };

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
        var usuarioId = ObtenerUsuarioId();
        if (usuarioId is null)
            return Unauthorized();

        var requestConDatosReales = request with { LoteId = id, UsuarioId = usuarioId.Value };

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
        var usuarioId = ObtenerUsuarioId();
        if (usuarioId is null)
            return Unauthorized();

        try
        {
            await _casoUsoCancelarLote.EjecutarAsync(new CancelarLoteRequest(id, usuarioId.Value));
            return NoContent();
        }
        catch (InventarioInvalidoException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    private int? ObtenerUsuarioId()
    {
        var usuarioIdClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        return usuarioIdClaim is not null && int.TryParse(usuarioIdClaim, out var usuarioId) ? usuarioId : null;
    }
}
