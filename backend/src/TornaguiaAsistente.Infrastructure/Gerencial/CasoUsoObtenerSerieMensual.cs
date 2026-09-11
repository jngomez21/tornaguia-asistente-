using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Infrastructure.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

public class CasoUsoObtenerSerieMensual : ICasoUsoObtenerSerieMensual
{
    private const int OffsetHorasColombia = 5;

    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerSerieMensual(TornaguiaDbContext context)
    {
        _context = context;
    }

    public Task<IReadOnlyList<PuntoSerieMensualResponse>> EjecutarAsync(int? anio, int? departamentoId = null) =>
        anio is not null ? EjecutarAnioAsync(anio.Value, departamentoId) : EjecutarHistoricoAsync(departamentoId);

    // Mes en hora local: agrupar por FechaSolicitud.Month (UTC) desplazaría a diciembre lo
    // creado después de las 7pm en Colombia. Dos consultas separadas porque una solicitud
    // puede no tener SolicitudProducto aún (detalle no generado) y no debe perderse el conteo.
    private async Task<IReadOnlyList<PuntoSerieMensualResponse>> EjecutarAnioAsync(int anio, int? departamentoId)
    {
        var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(anio);

        // Regla fija: tornaguías por origen, impuesto por destino.
        var conteos = await _context.Solicitudes
            .Where(s => s.FechaSolicitud >= desde && s.FechaSolicitud < hasta)
            .FiltrarPorDepartamento(departamentoId, CriterioDepartamento.Origen)
            .GroupBy(s => s.FechaSolicitud.AddHours(-OffsetHorasColombia).Month)
            .Select(g => new { Mes = g.Key, Tornaguias = g.Count() })
            .ToDictionaryAsync(x => x.Mes, x => x.Tornaguias);

        var impuestos = await _context.SolicitudesProductos
            .Where(sp => sp.Solicitud.FechaSolicitud >= desde && sp.Solicitud.FechaSolicitud < hasta)
            .FiltrarPorDepartamento(departamentoId, CriterioDepartamento.Destino)
            .GroupBy(sp => sp.Solicitud.FechaSolicitud.AddHours(-OffsetHorasColombia).Month)
            .Select(g => new { Mes = g.Key, Impuesto = g.Sum(x => x.ValorImpuestoConsumo) })
            .ToDictionaryAsync(x => x.Mes, x => x.Impuesto);

        return Enumerable.Range(1, 12)
            .Select(mes => new PuntoSerieMensualResponse(
                anio,
                mes,
                conteos.GetValueOrDefault(mes),
                impuestos.GetValueOrDefault(mes)))
            .ToList();
    }

    // Sin año: un punto por cada mes calendario entre la primera y la última solicitud (con ceros
    // en los meses sin movimiento, igual que la vista de un año), en vez de acotar a 12 meses.
    private async Task<IReadOnlyList<PuntoSerieMensualResponse>> EjecutarHistoricoAsync(int? departamentoId)
    {
        var conteosPorPeriodo = await _context.Solicitudes
            .FiltrarPorDepartamento(departamentoId, CriterioDepartamento.Origen)
            .GroupBy(s => new
            {
                Anio = s.FechaSolicitud.AddHours(-OffsetHorasColombia).Year,
                Mes = s.FechaSolicitud.AddHours(-OffsetHorasColombia).Month,
            })
            .Select(g => new { g.Key.Anio, g.Key.Mes, Tornaguias = g.Count() })
            .ToListAsync();

        var impuestosPorPeriodo = await _context.SolicitudesProductos
            .FiltrarPorDepartamento(departamentoId, CriterioDepartamento.Destino)
            .GroupBy(sp => new
            {
                Anio = sp.Solicitud.FechaSolicitud.AddHours(-OffsetHorasColombia).Year,
                Mes = sp.Solicitud.FechaSolicitud.AddHours(-OffsetHorasColombia).Month,
            })
            .Select(g => new { g.Key.Anio, g.Key.Mes, Impuesto = g.Sum(x => x.ValorImpuestoConsumo) })
            .ToListAsync();

        if (conteosPorPeriodo.Count == 0 && impuestosPorPeriodo.Count == 0)
            return Array.Empty<PuntoSerieMensualResponse>();

        var conteos = conteosPorPeriodo.ToDictionary(x => (x.Anio, x.Mes), x => x.Tornaguias);
        var impuestos = impuestosPorPeriodo.ToDictionary(x => (x.Anio, x.Mes), x => x.Impuesto);

        // El rango de meses tiene que cubrir los dos criterios a la vez: con un departamento
        // filtrado, el tráfico de origen y el impuesto de destino son subconjuntos de solicitudes
        // distintos y pueden abarcar períodos distintos — usar solo uno de los dos recortaba meses
        // enteros del otro (ej. impuesto de un mes sin tráfico de origen quedaba fuera del rango).
        var periodos = conteos.Keys.Concat(impuestos.Keys).ToList();
        var (anioDesde, mesDesde) = periodos.Min();
        var (anioHasta, mesHasta) = periodos.Max();

        var puntos = new List<PuntoSerieMensualResponse>();
        var (anioActual, mesActual) = (anioDesde, mesDesde);
        while (anioActual < anioHasta || (anioActual == anioHasta && mesActual <= mesHasta))
        {
            puntos.Add(new PuntoSerieMensualResponse(
                anioActual,
                mesActual,
                conteos.GetValueOrDefault((anioActual, mesActual)),
                impuestos.GetValueOrDefault((anioActual, mesActual))));

            mesActual++;
            if (mesActual > 12)
            {
                mesActual = 1;
                anioActual++;
            }
        }

        return puntos;
    }
}
