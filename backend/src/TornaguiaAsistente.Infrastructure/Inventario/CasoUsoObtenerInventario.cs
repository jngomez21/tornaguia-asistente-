using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

public class CasoUsoObtenerInventario : ICasoUsoObtenerInventario
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerInventario(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<InventarioItemResponse>> EjecutarAsync(int bodegaId, int usuarioId)
    {
        await InventarioAjustes.ObtenerBodegaPropiaAsync(_context, bodegaId, usuarioId);

        return await _context.InventarioProductos
            .Where(i => i.BodegaId == bodegaId)
            .OrderBy(i => i.Producto.Nombre)
            .Select(i => new InventarioItemResponse(i.ProductoId, i.Producto.Nombre, i.CantidadDisponible))
            .ToListAsync();
    }
}
