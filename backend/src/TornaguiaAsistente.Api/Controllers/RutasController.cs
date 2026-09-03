using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Application.Geografia;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RutasController : ControllerBase
{
    private readonly IMotorGeografico _motorGeografico;

    public RutasController(IMotorGeografico motorGeografico)
    {
        _motorGeografico = motorGeografico;
    }

    [HttpGet("calcular")]
    public async Task<ActionResult<ResultadoRuta>> Calcular(
        [FromQuery] int origenId,
        [FromQuery] int? destinoId,
        [FromQuery] int? paisDestinoId,
        CancellationToken cancellationToken)
    {
        if (destinoId is null && paisDestinoId is null)
            return BadRequest(new { mensaje = "Debe indicar destinoId o paisDestinoId." });
        if (destinoId is not null && paisDestinoId is not null)
            return BadRequest(new { mensaje = "Solo puede indicar un tipo de destino." });

        var resultado = paisDestinoId is not null
            ? await _motorGeografico.CalcularRutaHaciaPaisAsync(origenId, paisDestinoId.Value, cancellationToken)
            : await _motorGeografico.CalcularRutaAsync(origenId, destinoId!.Value, cancellationToken);

        return Ok(resultado);
    }
}
