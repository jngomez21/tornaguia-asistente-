using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TornaguiaAsistente.Api.Dtos;
using TornaguiaAsistente.Application.Autenticacion;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Application.Solicitudes;

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
    private readonly ICasoUsoObtenerPdfTornaguia _casoUsoObtenerPdf;
    private readonly ICasoUsoObtenerDocumentoDeclaracion _casoUsoObtenerDocumentoDeclaracion;

    public GerencialController(
        ICasoUsoObtenerResumenGerencial casoUsoResumen,
        ICasoUsoObtenerSerieMensual casoUsoSerieMensual,
        ICasoUsoObtenerDistribucionPorTipo casoUsoDistribucionPorTipo,
        ICasoUsoObtenerVolumenPorDepartamento casoUsoVolumenPorDepartamento,
        ICasoUsoObtenerTopProductos casoUsoTopProductos,
        ICasoUsoObtenerTopRutas casoUsoTopRutas,
        ICasoUsoListarContribuyentes casoUsoListarContribuyentes,
        ICasoUsoObtenerResumenContribuyente casoUsoResumenContribuyente,
        ICasoUsoObtenerPdfTornaguia casoUsoObtenerPdf,
        ICasoUsoObtenerDocumentoDeclaracion casoUsoObtenerDocumentoDeclaracion)
    {
        _casoUsoResumen = casoUsoResumen;
        _casoUsoSerieMensual = casoUsoSerieMensual;
        _casoUsoDistribucionPorTipo = casoUsoDistribucionPorTipo;
        _casoUsoVolumenPorDepartamento = casoUsoVolumenPorDepartamento;
        _casoUsoTopProductos = casoUsoTopProductos;
        _casoUsoTopRutas = casoUsoTopRutas;
        _casoUsoListarContribuyentes = casoUsoListarContribuyentes;
        _casoUsoResumenContribuyente = casoUsoResumenContribuyente;
        _casoUsoObtenerPdf = casoUsoObtenerPdf;
        _casoUsoObtenerDocumentoDeclaracion = casoUsoObtenerDocumentoDeclaracion;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardGerencialResponse>> GetDashboard([FromQuery] int? anio, [FromQuery] int? departamentoId)
    {
        // VolumenPorDepartamento nunca se acota: es el mapa de los 33 departamentos que sirve para
        // elegir uno nuevo, así que siempre trae la vista nacional completa (el frontend resalta
        // ahí mismo cuál está activo). Todo lo demás sí respeta el departamento seleccionado (con
        // tornaguías por origen e impuesto por destino, regla fija — ver CriterioDepartamento).
        var dashboard = new DashboardGerencialResponse(
            Resumen: await _casoUsoResumen.EjecutarAsync(anio, departamentoId),
            SerieMensual: await _casoUsoSerieMensual.EjecutarAsync(anio, departamentoId),
            DistribucionPorTipo: await _casoUsoDistribucionPorTipo.EjecutarAsync(anio, departamentoId),
            VolumenPorDepartamento: await _casoUsoVolumenPorDepartamento.EjecutarAsync(anio),
            TopProductos: await _casoUsoTopProductos.EjecutarAsync(anio, departamentoId: departamentoId),
            TopRutas: await _casoUsoTopRutas.EjecutarAsync(anio, departamentoId: departamentoId),
            Contribuyentes: await _casoUsoListarContribuyentes.EjecutarAsync(anio, departamentoId: departamentoId));

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

    [HttpGet("solicitudes/{id}/pdf")]
    public async Task<IActionResult> GetPdfSolicitud(int id)
    {
        try
        {
            var pdfBytes = await _casoUsoObtenerPdf.EjecutarSinVerificarDuenoAsync(id);
            return File(pdfBytes, "application/pdf", $"tornaguia-{id}.pdf");
        }
        catch (SolicitudInvalidaException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
    }

    [HttpGet("declaraciones/{id}/documento")]
    public async Task<IActionResult> GetDocumentoDeclaracion(int id)
    {
        try
        {
            var documento = await _casoUsoObtenerDocumentoDeclaracion.EjecutarAsync(id);
            return File(documento.Bytes, documento.ContentType, documento.NombreArchivo);
        }
        catch (InventarioInvalidoException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
    }
}
