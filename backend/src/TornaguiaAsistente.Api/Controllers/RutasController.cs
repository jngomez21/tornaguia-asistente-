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
        [FromQuery] int destinoId)
    {
        var resultado = await _motorGeografico.CalcularRutaAsync(origenId, destinoId);
        return Ok(resultado);
    }
}