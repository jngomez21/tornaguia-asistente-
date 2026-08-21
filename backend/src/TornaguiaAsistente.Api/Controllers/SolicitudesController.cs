using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Application.Solicitudes;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("fixed")]
[Authorize]
public class SolicitudesController : ControllerBase
{
    private readonly ICasoUsoCrearSolicitud _casoUso;
    private readonly ICasoUsoGuardarDetalleTornaguia _casoUsoGuardarDetalle;

    public SolicitudesController(
        ICasoUsoCrearSolicitud casoUso,
        ICasoUsoGuardarDetalleTornaguia casoUsoGuardarDetalle)
    {
        _casoUso = casoUso;
        _casoUsoGuardarDetalle = casoUsoGuardarDetalle;
    }

    [HttpPost]
    public async Task<ActionResult<CrearSolicitudResponse>> Crear(CrearSolicitudRequest request)
    {
        var usuarioId = ObtenerUsuarioId();
        if (usuarioId is null)
            return Unauthorized();

        var requestConUsuarioReal = request with { UsuarioId = usuarioId.Value };

        try
        {
            var resultado = await _casoUso.EjecutarAsync(requestConUsuarioReal);
            return Ok(resultado);
        }
        catch (SolicitudInvalidaException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPost("{id}/detalle-tornaguia")]
    public async Task<ActionResult<DetalleTornaguiaResponse>> GuardarDetalle(
        int id,
        GuardarDetalleTornaguiaRequest request)
    {
        var usuarioId = ObtenerUsuarioId();
        if (usuarioId is null)
            return Unauthorized();

        var requestConDatosReales = request with { SolicitudId = id, UsuarioId = usuarioId.Value };

        try
        {
            var resultado = await _casoUsoGuardarDetalle.EjecutarAsync(requestConDatosReales);
            return Ok(resultado);
        }
        catch (SolicitudInvalidaException ex)
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