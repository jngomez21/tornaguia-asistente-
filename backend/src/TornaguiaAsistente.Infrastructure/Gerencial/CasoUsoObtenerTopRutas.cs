using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Infrastructure.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

public class CasoUsoObtenerTopRutas : ICasoUsoObtenerTopRutas
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerTopRutas(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<TopRutaResponse>> EjecutarAsync(int? anio, int? limite = null, int? departamentoId = null)
    {
        var query = _context.Solicitudes.AsQueryable();
        if (anio is not null)
        {
            var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(anio.Value);
            query = query.Where(s => s.FechaSolicitud >= desde && s.FechaSolicitud < hasta);
        }

        // Rutas es puro tráfico (sin impuesto en el record): siempre por origen.
        query = query.FiltrarPorDepartamento(departamentoId, CriterioDepartamento.Origen);

        // Igual que en TopProductos: se proyecta a un tipo anónimo antes de construir el record.
        var agrupado = await query
            .GroupBy(s => new
            {
                Origen = s.MunicipioOrigen.Nombre,
                Destino = s.MunicipioDestino != null ? s.MunicipioDestino.Nombre : s.PaisDestino!.Nombre
            })
            .Select(g => new { g.Key.Origen, g.Key.Destino, Cantidad = g.Count() })
            .OrderByDescending(x => x.Cantidad)
            .Take(limite ?? int.MaxValue)
            .ToListAsync();

        return agrupado
            .Select(x => new TopRutaResponse(x.Origen, x.Destino, x.Cantidad))
            .ToList();
    }
}
