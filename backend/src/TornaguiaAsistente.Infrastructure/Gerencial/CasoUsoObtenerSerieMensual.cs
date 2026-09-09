using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Infrastructure.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

public class CasoUsoObtenerSerieMensual : ICasoUsoObtenerSerieMensual
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerSerieMensual(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<PuntoSerieMensualResponse>> EjecutarAsync(int anio)
    {
        var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(anio);

        // Mes en hora local: agrupar por FechaSolicitud.Month (UTC) desplazaría a diciembre lo
        // creado después de las 7pm en Colombia. Dos consultas separadas porque una solicitud
        // puede no tener SolicitudProducto aún (detalle no generado) y no debe perderse el conteo.
        var conteos = await _context.Solicitudes
            .Where(s => s.FechaSolicitud >= desde && s.FechaSolicitud < hasta)
            .GroupBy(s => s.FechaSolicitud.AddHours(-5).Month)
            .Select(g => new { Mes = g.Key, Tornaguias = g.Count() })
            .ToDictionaryAsync(x => x.Mes, x => x.Tornaguias);

        var impuestos = await _context.SolicitudesProductos
            .Where(sp => sp.Solicitud.FechaSolicitud >= desde && sp.Solicitud.FechaSolicitud < hasta)
            .GroupBy(sp => sp.Solicitud.FechaSolicitud.AddHours(-5).Month)
            .Select(g => new { Mes = g.Key, Impuesto = g.Sum(x => x.ValorImpuestoConsumo) })
            .ToDictionaryAsync(x => x.Mes, x => x.Impuesto);

        return Enumerable.Range(1, 12)
            .Select(mes => new PuntoSerieMensualResponse(
                mes,
                conteos.GetValueOrDefault(mes),
                impuestos.GetValueOrDefault(mes)))
            .ToList();
    }
}
