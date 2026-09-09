using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TornaguiaAsistente.Application.Asistente;
using TornaguiaAsistente.Application.Gerencial;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/gerencial/asistente")]
[EnableRateLimiting("fixed")]
[Authorize(Roles = "Ejecutivo")]
public class GerencialAsistenteController : ApiControllerBase
{
    private readonly ICasoUsoResponderPreguntaGerencial _casoUsoResponderPregunta;
    private readonly ICasoUsoObtenerHistorialConversacion _casoUsoObtenerHistorial;

    public GerencialAsistenteController(
        ICasoUsoResponderPreguntaGerencial casoUsoResponderPregunta,
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
    public async Task<ActionResult<ResponderPreguntaGerencialResponse>> Preguntar(
        PreguntarGerencialRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var resultado = await _casoUsoResponderPregunta.EjecutarAsync(
                new ResponderPreguntaGerencialRequest(UsuarioId, request.Pregunta, request.ConversacionId), cancellationToken);
            return Ok(resultado);
        }
        catch (AsistenteNoDisponibleException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { mensaje = ex.Message });
        }
    }
}

public record PreguntarGerencialRequest(string Pregunta, Guid ConversacionId);
