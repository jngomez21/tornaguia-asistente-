using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Application.Solicitudes;
using Microsoft.AspNetCore.RateLimiting;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("fixed")]
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
        try
        {
            var resultado = await _casoUso.EjecutarAsync(request);
            return Ok(resultado);
        }
        catch (SolicitudInvalidaException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}