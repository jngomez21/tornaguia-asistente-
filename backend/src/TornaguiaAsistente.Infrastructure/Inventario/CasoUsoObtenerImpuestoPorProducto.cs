using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

public class CasoUsoObtenerImpuestoPorProducto : ICasoUsoObtenerImpuestoPorProducto
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerImpuestoPorProducto(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<ImpuestoPorProductoResponse>> EjecutarAsync(int usuarioId)
    {
        // Solo lotes Reservado: uno Vinculado ya aporta su valor via SolicitudProducto (evita doble conteo).
        var enLotesSinUsar = await _context.LotesProductos
            .Where(lp => lp.Lote.Estado == EstadoLote.Reservado && lp.Lote.Bodega!.UsuarioId == usuarioId)
            .GroupBy(lp => new { lp.ProductoId, lp.Producto.Nombre })
            .Select(g => new { g.Key.ProductoId, g.Key.Nombre, Total = g.Sum(x => x.ValorImpuestoConsumo) })
            .ToListAsync();

        var enSolicitudes = await _context.SolicitudesProductos
            .Where(sp => sp.Solicitud.UsuarioId == usuarioId)
            .GroupBy(sp => new { sp.ProductoId, sp.Producto.Nombre })
            .Select(g => new { g.Key.ProductoId, g.Key.Nombre, Total = g.Sum(x => x.ValorImpuestoConsumo) })
            .ToListAsync();

        return enLotesSinUsar.Concat(enSolicitudes)
            .GroupBy(x => new { x.ProductoId, x.Nombre })
            .Select(g => new ImpuestoPorProductoResponse(g.Key.ProductoId, g.Key.Nombre, g.Sum(x => x.Total)))
            .OrderByDescending(x => x.ValorImpuestoTotal)
            .ToList();
    }
}
