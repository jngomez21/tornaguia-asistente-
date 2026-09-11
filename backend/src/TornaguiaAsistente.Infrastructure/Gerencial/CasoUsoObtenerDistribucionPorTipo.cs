using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Infrastructure.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

public class CasoUsoObtenerDistribucionPorTipo : ICasoUsoObtenerDistribucionPorTipo
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerDistribucionPorTipo(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<DistribucionTipoResponse>> EjecutarAsync(int? anio, int? departamentoId = null)
    {
        var solicitudesQuery = _context.Solicitudes.AsQueryable();
        var productosQuery = _context.SolicitudesProductos.AsQueryable();
        if (anio is not null)
        {
            var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(anio.Value);
            solicitudesQuery = solicitudesQuery.Where(s => s.FechaSolicitud >= desde && s.FechaSolicitud < hasta);
            productosQuery = productosQuery.Where(sp => sp.Solicitud.FechaSolicitud >= desde && sp.Solicitud.FechaSolicitud < hasta);
        }

        // Regla fija: cantidad de tornaguías por origen, impuesto por destino.
        solicitudesQuery = solicitudesQuery.FiltrarPorDepartamento(departamentoId, CriterioDepartamento.Origen);
        productosQuery = productosQuery.FiltrarPorDepartamento(departamentoId, CriterioDepartamento.Destino);

        var cantidades = await solicitudesQuery
            .GroupBy(s => s.TipoTornaguia.Nombre)
            .Select(g => new { Tipo = g.Key, Cantidad = g.Count() })
            .ToDictionaryAsync(x => x.Tipo, x => x.Cantidad);

        var impuestos = await productosQuery
            .GroupBy(sp => sp.Solicitud.TipoTornaguia.Nombre)
            .Select(g => new { Tipo = g.Key, Impuesto = g.Sum(x => x.ValorImpuestoConsumo) })
            .ToDictionaryAsync(x => x.Tipo, x => x.Impuesto);

        // Los 3 tipos del catálogo siempre aparecen, aunque tengan 0: si no, la dona del
        // frontend pierde una porción en vez de mostrarla vacía.
        var tipos = await _context.TiposTornaguia.Select(t => t.Nombre).ToListAsync();

        return tipos
            .Select(tipo => new DistribucionTipoResponse(
                tipo,
                cantidades.GetValueOrDefault(tipo),
                impuestos.GetValueOrDefault(tipo)))
            .ToList();
    }
}
