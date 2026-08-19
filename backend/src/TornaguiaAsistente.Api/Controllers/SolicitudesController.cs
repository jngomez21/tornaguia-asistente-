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

    public SolicitudesController(ICasoUsoCrearSolicitud casoUso)
    {
        _casoUso = casoUso;
    }

    [HttpPost]
    public async Task<ActionResult<CrearSolicitudResponse>> Crear(CrearSolicitudRequest request)
    {
        var usuarioIdClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

        if (usuarioIdClaim is null || !int.TryParse(usuarioIdClaim, out var usuarioId))
            return Unauthorized();

        var requestConUsuarioReal = request with { UsuarioId = usuarioId };

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
}