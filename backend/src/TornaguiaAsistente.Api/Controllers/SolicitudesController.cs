using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Application.Solicitudes;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("fixed")]
[Authorize]
public class SolicitudesController : ApiControllerBase
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
        var resultado = await _casoUsoHistorial.EjecutarAsync(UsuarioId);
        return Ok(resultado);
    }

    [HttpPost]
    public async Task<ActionResult<CrearSolicitudResponse>> Crear(CrearSolicitudRequest request, CancellationToken cancellationToken)
    {
        var requestConUsuarioReal = request with { UsuarioId = UsuarioId };

        try
        {
            var resultado = await _casoUso.EjecutarAsync(requestConUsuarioReal, cancellationToken);
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
        var requestConDatosReales = request with { SolicitudId = id, UsuarioId = UsuarioId };

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
        try
        {
            var resultado = await _casoUsoObtenerSolicitud.EjecutarAsync(id, UsuarioId);
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
        var requestConDatosReales = request with { SolicitudId = id, UsuarioId = UsuarioId };

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
        try
        {
            var pdfBytes = await _casoUsoObtenerPdf.EjecutarAsync(id, UsuarioId);
            return File(pdfBytes, "application/pdf", $"tornaguia-{id}.pdf");
        }
        catch (SolicitudInvalidaException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
    }
}
