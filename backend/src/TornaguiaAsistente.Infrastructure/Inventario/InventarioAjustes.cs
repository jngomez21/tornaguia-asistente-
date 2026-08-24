using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

internal static class InventarioAjustes
{
    public static Dictionary<int, decimal> AgruparCantidades(IReadOnlyList<LoteProductoRequest> productos)
    {
        if (productos.Count == 0)
            throw new InventarioInvalidoException("El lote debe tener al menos un producto.");

        var agrupado = new Dictionary<int, decimal>();
        foreach (var p in productos)
        {
            if (p.Cantidad <= 0)
                throw new InventarioInvalidoException("La cantidad de cada producto debe ser mayor que cero.");

            agrupado[p.ProductoId] = agrupado.GetValueOrDefault(p.ProductoId) + p.Cantidad;
        }

        return agrupado;
    }

    public static async Task DescontarAsync(
        TornaguiaDbContext context, int usuarioId, IReadOnlyDictionary<int, decimal> cantidades)
    {
        foreach (var (productoId, cantidad) in cantidades)
        {
            var inventario = await context.InventarioProductos
                .FirstOrDefaultAsync(i => i.UsuarioId == usuarioId && i.ProductoId == productoId)
                ?? throw new InventarioInvalidoException(
                    $"No hay inventario registrado para el producto {productoId}.");

            if (inventario.CantidadDisponible < cantidad)
            {
                var producto = await context.Productos.FindAsync(productoId);
                throw new InventarioInvalidoException(
                    $"Stock insuficiente de {producto?.Nombre ?? productoId.ToString()}: " +
                    $"disponible {inventario.CantidadDisponible}, solicitado {cantidad}.");
            }

            inventario.CantidadDisponible -= cantidad;
        }
    }

    public static async Task ReponerAsync(
        TornaguiaDbContext context, int usuarioId, IEnumerable<LoteProducto> loteProductos)
    {
        foreach (var lp in loteProductos)
        {
            var inventario = await context.InventarioProductos
                .FirstOrDefaultAsync(i => i.UsuarioId == usuarioId && i.ProductoId == lp.ProductoId)
                ?? throw new InvalidOperationException(
                    $"Inventario no encontrado para el producto {lp.ProductoId}.");

            inventario.CantidadDisponible += lp.Cantidad;
        }
    }

    public static string NumeroSerie(int loteId) => $"LT-{loteId:D6}";

    public static LoteResponse AResponse(Lote lote) => new(
        LoteId: lote.Id,
        NumeroSerie: NumeroSerie(lote.Id),
        Estado: lote.Estado.ToString(),
        FechaCreacion: lote.FechaCreacion,
        Productos: lote.LoteProductos
            .Select(lp => new LoteProductoResponse(lp.ProductoId, lp.Producto.Nombre, lp.Cantidad))
            .ToList()
    );

    public static async Task<LoteResponse> ObtenerRespuestaAsync(TornaguiaDbContext context, int loteId)
    {
        var lote = await context.Lotes
            .Include(l => l.LoteProductos).ThenInclude(lp => lp.Producto)
            .FirstAsync(l => l.Id == loteId);

        return AResponse(lote);
    }
}
