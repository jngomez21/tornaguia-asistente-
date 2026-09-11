using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Infrastructure.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

public class CasoUsoObtenerTopProductos : ICasoUsoObtenerTopProductos
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerTopProductos(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<TopProductoResponse>> EjecutarAsync(int? anio, int? limite = null, int? departamentoId = null)
    {
        var queryBase = _context.SolicitudesProductos.AsQueryable();
        if (anio is not null)
        {
            var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(anio.Value);
            queryBase = queryBase.Where(sp => sp.Solicitud.FechaSolicitud >= desde && sp.Solicitud.FechaSolicitud < hasta);
        }

        // Regla fija: unidades (cuánto producto se movió) por origen, impuesto por destino — pueden
        // salir de líneas de solicitud distintas del mismo producto, así que van en dos consultas.
        var unidadesPorProducto = await queryBase
            .FiltrarPorDepartamento(departamentoId, CriterioDepartamento.Origen)
            .GroupBy(sp => sp.ProductoId)
            .Select(g => new { ProductoId = g.Key, Unidades = g.Sum(x => x.Cantidad) })
            .ToDictionaryAsync(x => x.ProductoId, x => x.Unidades);

        var impuestoPorProducto = await queryBase
            .FiltrarPorDepartamento(departamentoId, CriterioDepartamento.Destino)
            .GroupBy(sp => sp.ProductoId)
            .Select(g => new { ProductoId = g.Key, Impuesto = g.Sum(x => x.ValorImpuestoConsumo) })
            .ToDictionaryAsync(x => x.ProductoId, x => x.Impuesto);

        var productoIds = unidadesPorProducto.Keys.Union(impuestoPorProducto.Keys).ToList();
        var nombresPorProducto = await _context.Productos
            .Where(p => productoIds.Contains(p.Id))
            .Select(p => new { p.Id, p.Nombre })
            .ToDictionaryAsync(x => x.Id, x => x.Nombre);

        return productoIds
            .Select(id => new TopProductoResponse(
                id,
                nombresPorProducto.GetValueOrDefault(id, string.Empty),
                impuestoPorProducto.GetValueOrDefault(id),
                unidadesPorProducto.GetValueOrDefault(id)))
            .OrderByDescending(x => x.Impuesto)
            .Take(limite ?? int.MaxValue)
            .ToList();
    }
}
