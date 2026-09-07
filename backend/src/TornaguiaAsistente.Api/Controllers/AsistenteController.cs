using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Application.Asistente;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("fixed")]
[Authorize]
public class AsistenteController : ApiControllerBase
{
    private readonly ICasoUsoResponderPregunta _casoUsoResponderPregunta;
    private readonly ICasoUsoObtenerHistorialConversacion _casoUsoObtenerHistorial;

    public AsistenteController(
        ICasoUsoResponderPregunta casoUsoResponderPregunta,
        ICasoUsoObtenerHistorialConversacion casoUsoObtenerHistorial)
    {
        _casoUsoResponderPregunta = casoUsoResponderPregunta;
        _casoUsoObtenerHistorial = casoUsoObtenerHistorial;
    }

    [HttpGet("historial")]
    public async Task<ActionResult<IReadOnlyList<MensajeAsistenteResponse>>> Historial()
    {
        var resultado = await _casoUsoObtenerHistorial.EjecutarAsync(UsuarioId);
        return Ok(resultado);
    }

    [HttpPost("preguntar")]
    public async Task<ActionResult<ResponderPreguntaResponse>> Preguntar(
        PreguntarRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var resultado = await _casoUsoResponderPregunta.EjecutarAsync(
                new ResponderPreguntaRequest(UsuarioId, request.Pregunta, request.ConversacionId), cancellationToken);
            return Ok(resultado);
        }
        catch (AsistenteNoDisponibleException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { mensaje = ex.Message });
        }
    }
}

public record PreguntarRequest(string Pregunta, Guid ConversacionId);
