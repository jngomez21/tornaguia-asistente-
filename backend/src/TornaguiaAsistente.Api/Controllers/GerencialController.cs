using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TornaguiaAsistente.Api.Dtos;
using TornaguiaAsistente.Application.Autenticacion;
using TornaguiaAsistente.Application.Gerencial;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("fixed")]
[Authorize(Roles = "Ejecutivo")]
public class GerencialController : ControllerBase
{
    private readonly ICasoUsoObtenerResumenGerencial _casoUsoResumen;
    private readonly ICasoUsoObtenerSerieMensual _casoUsoSerieMensual;
    private readonly ICasoUsoObtenerDistribucionPorTipo _casoUsoDistribucionPorTipo;
    private readonly ICasoUsoObtenerVolumenPorDepartamento _casoUsoVolumenPorDepartamento;
    private readonly ICasoUsoObtenerTopProductos _casoUsoTopProductos;
    private readonly ICasoUsoObtenerTopRutas _casoUsoTopRutas;
    private readonly ICasoUsoListarContribuyentes _casoUsoListarContribuyentes;
    private readonly ICasoUsoObtenerResumenContribuyente _casoUsoResumenContribuyente;

    public GerencialController(
        ICasoUsoObtenerResumenGerencial casoUsoResumen,
        ICasoUsoObtenerSerieMensual casoUsoSerieMensual,
        ICasoUsoObtenerDistribucionPorTipo casoUsoDistribucionPorTipo,
        ICasoUsoObtenerVolumenPorDepartamento casoUsoVolumenPorDepartamento,
        ICasoUsoObtenerTopProductos casoUsoTopProductos,
        ICasoUsoObtenerTopRutas casoUsoTopRutas,
        ICasoUsoListarContribuyentes casoUsoListarContribuyentes,
        ICasoUsoObtenerResumenContribuyente casoUsoResumenContribuyente)
    {
        _casoUsoResumen = casoUsoResumen;
        _casoUsoSerieMensual = casoUsoSerieMensual;
        _casoUsoDistribucionPorTipo = casoUsoDistribucionPorTipo;
        _casoUsoVolumenPorDepartamento = casoUsoVolumenPorDepartamento;
        _casoUsoTopProductos = casoUsoTopProductos;
        _casoUsoTopRutas = casoUsoTopRutas;
        _casoUsoListarContribuyentes = casoUsoListarContribuyentes;
        _casoUsoResumenContribuyente = casoUsoResumenContribuyente;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardGerencialResponse>> GetDashboard([FromQuery] int? anio)
    {
        var resumen = await _casoUsoResumen.EjecutarAsync(anio);

        // La serie mensual necesita un año concreto: sin filtro, se usa el más reciente con
        // datos (o el año actual si todavía no hay ninguna solicitud en el sistema).
        var anioSerie = anio ?? resumen.AniosDisponibles.FirstOrDefault(DateTime.UtcNow.Year);

        var dashboard = new DashboardGerencialResponse(
            Resumen: resumen,
            SerieMensual: await _casoUsoSerieMensual.EjecutarAsync(anioSerie),
            DistribucionPorTipo: await _casoUsoDistribucionPorTipo.EjecutarAsync(anio),
            VolumenPorDepartamento: await _casoUsoVolumenPorDepartamento.EjecutarAsync(anio),
            TopProductos: await _casoUsoTopProductos.EjecutarAsync(anio),
            TopRutas: await _casoUsoTopRutas.EjecutarAsync(anio),
            Contribuyentes: await _casoUsoListarContribuyentes.EjecutarAsync(anio));

        return Ok(dashboard);
    }

    [HttpGet("contribuyentes/{id}")]
    public async Task<ActionResult<ResumenContribuyenteResponse>> GetContribuyente(int id, [FromQuery] int? anio)
    {
        try
        {
            var resumen = await _casoUsoResumenContribuyente.EjecutarAsync(id, anio);
            return Ok(resumen);
        }
        catch (UsuarioNoEncontradoException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
    }
}
