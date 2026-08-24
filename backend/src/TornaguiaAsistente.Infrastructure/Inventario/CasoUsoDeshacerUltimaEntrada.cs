using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

public class CasoUsoDeshacerUltimaEntrada : ICasoUsoDeshacerUltimaEntrada
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoDeshacerUltimaEntrada(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<InventarioItemResponse> EjecutarAsync(DeshacerUltimaEntradaRequest request)
    {
        var producto = await _context.Productos.FindAsync(request.ProductoId)
            ?? throw new InventarioInvalidoException($"Producto {request.ProductoId} no encontrado.");

        var entrada = await _context.EntradasInventario
            .Where(e => e.UsuarioId == request.UsuarioId && e.ProductoId == request.ProductoId)
            .OrderByDescending(e => e.Fecha)
            .ThenByDescending(e => e.Id)
            .FirstOrDefaultAsync()
            ?? throw new InventarioInvalidoException("No hay entradas registradas para este producto.");

        var inventario = await _context.InventarioProductos
            .FirstOrDefaultAsync(i => i.UsuarioId == request.UsuarioId && i.ProductoId == request.ProductoId)
            ?? throw new InventarioInvalidoException("No hay inventario registrado para este producto.");

        if (inventario.CantidadDisponible < entrada.Cantidad)
            throw new InventarioInvalidoException(
                "No se puede deshacer: parte de esta mercancía ya se usó en un lote.");

        inventario.CantidadDisponible -= entrada.Cantidad;
        _context.EntradasInventario.Remove(entrada);

        await _context.SaveChangesAsync();

        return new InventarioItemResponse(producto.Id, producto.Nombre, inventario.CantidadDisponible);
    }
}
