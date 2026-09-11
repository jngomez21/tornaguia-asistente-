using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

/// <summary>usuarioId = null → cualquier bodega, sin verificar dueño (gerencial); con valor →
/// la bodega debe pertenecerle (contribuyente, mismo comportamiento de siempre).</summary>
internal static class InventarioQueries
{
    public static async Task<IReadOnlyList<InventarioItemResponse>> ObtenerInventarioAsync(
        TornaguiaDbContext ctx, int bodegaId, int? usuarioId)
    {
        var bodega = await ctx.Bodegas.FirstOrDefaultAsync(b => b.Id == bodegaId)
            ?? throw new InventarioInvalidoException($"Bodega {bodegaId} no encontrada.");

        if (usuarioId is not null)
            InventarioAjustes.AsegurarPropietario(bodega.UsuarioId, usuarioId.Value, "La bodega");

        return await ctx.InventarioProductos
            .Where(i => i.BodegaId == bodegaId)
            .OrderBy(i => i.Producto.Nombre)
            .Select(i => new InventarioItemResponse(i.ProductoId, i.Producto.Nombre, i.CantidadDisponible))
            .ToListAsync();
    }
}
