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
    private readonly ICasoUsoObtenerHistorialSolicitudes _casoUsoHistorial;
    private readonly ICasoUsoGuardarPdfTornaguia _casoUsoGuardarPdf;
    private readonly ICasoUsoObtenerPdfTornaguia _casoUsoObtenerPdf;
    private readonly ICasoUsoObtenerSolicitud _casoUsoObtenerSolicitud;

    public SolicitudesController(
        ICasoUsoCrearSolicitud casoUso,
        ICasoUsoGuardarDetalleTornaguia casoUsoGuardarDetalle,
        ICasoUsoObtenerHistorialSolicitudes casoUsoHistorial,
        ICasoUsoGuardarPdfTornaguia casoUsoGuardarPdf,
        ICasoUsoObtenerPdfTornaguia casoUsoObtenerPdf,
        ICasoUsoObtenerSolicitud casoUsoObtenerSolicitud)
    {
        _casoUso = casoUso;
        _casoUsoGuardarDetalle = casoUsoGuardarDetalle;
        _casoUsoHistorial = casoUsoHistorial;
        _casoUsoGuardarPdf = casoUsoGuardarPdf;
        _casoUsoObtenerPdf = casoUsoObtenerPdf;
        _casoUsoObtenerSolicitud = casoUsoObtenerSolicitud;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<HistorialSolicitudResponse>>> Historial()
    {
        var usuarioId = ObtenerUsuarioId();
        if (usuarioId is null)
            return Unauthorized();

        var resultado = await _casoUsoHistorial.EjecutarAsync(usuarioId.Value);
        return Ok(resultado);
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

    [HttpGet("{id}")]
    public async Task<ActionResult<CrearSolicitudResponse>> ObtenerSolicitud(int id)
    {
        var usuarioId = ObtenerUsuarioId();
        if (usuarioId is null)
            return Unauthorized();

        try
        {
            var resultado = await _casoUsoObtenerSolicitud.EjecutarAsync(id, usuarioId.Value);
            return Ok(resultado);
        }
        catch (SolicitudInvalidaException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id}/pdf")]
    public async Task<IActionResult> GuardarPdf(int id, GuardarPdfTornaguiaRequest request)
    {
        var usuarioId = ObtenerUsuarioId();
        if (usuarioId is null)
            return Unauthorized();

        var requestConDatosReales = request with { SolicitudId = id, UsuarioId = usuarioId.Value };

        try
        {
            await _casoUsoGuardarPdf.EjecutarAsync(requestConDatosReales);
            return NoContent();
        }
        catch (SolicitudInvalidaException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> ObtenerPdf(int id)
    {
        var usuarioId = ObtenerUsuarioId();
        if (usuarioId is null)
            return Unauthorized();

        try
        {
            var pdfBytes = await _casoUsoObtenerPdf.EjecutarAsync(id, usuarioId.Value);
            return File(pdfBytes, "application/pdf", $"tornaguia-{id}.pdf");
        }
        catch (SolicitudInvalidaException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
    }

    private int? ObtenerUsuarioId()
    {
        var usuarioIdClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        return usuarioIdClaim is not null && int.TryParse(usuarioIdClaim, out var usuarioId) ? usuarioId : null;
    }
}