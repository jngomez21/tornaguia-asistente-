using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Infrastructure.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

public class CasoUsoObtenerTopProductos : ICasoUsoObtenerTopProductos
{
    private const int LimiteResultados = 10;

    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerTopProductos(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<TopProductoResponse>> EjecutarAsync(int? anio)
    {
        var query = _context.SolicitudesProductos.AsQueryable();
        if (anio is not null)
        {
            var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(anio.Value);
            query = query.Where(sp => sp.Solicitud.FechaSolicitud >= desde && sp.Solicitud.FechaSolicitud < hasta);
        }

        // EF Core no traduce un Select que construya el record directamente con dos Sum() tras
        // el GroupBy; se proyecta primero a un tipo anónimo y se mapea al record ya en memoria.
        var agrupado = await query
            .GroupBy(sp => new { sp.ProductoId, sp.Producto.Nombre })
            .Select(g => new
            {
                g.Key.ProductoId,
                g.Key.Nombre,
                Impuesto = g.Sum(x => x.ValorImpuestoConsumo),
                Unidades = g.Sum(x => x.Cantidad)
            })
            .OrderByDescending(x => x.Impuesto)
            .Take(LimiteResultados)
            .ToListAsync();

        return agrupado
            .Select(x => new TopProductoResponse(x.ProductoId, x.Nombre, x.Impuesto, x.Unidades))
            .ToList();
    }
}
