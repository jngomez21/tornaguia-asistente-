using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

public class CasoUsoEditarInventario : ICasoUsoEditarInventario
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoEditarInventario(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<InventarioItemResponse> EjecutarAsync(EditarInventarioRequest request)
    {
        if (request.CantidadDisponible < 0)
            throw new InventarioInvalidoException("La cantidad disponible no puede ser negativa.");

        await InventarioAjustes.ObtenerBodegaPropiaAsync(_context, request.BodegaId, request.UsuarioId);

        var producto = await _context.Productos.FindAsync(request.ProductoId)
            ?? throw new InventarioInvalidoException($"Producto {request.ProductoId} no encontrado.");

        var inventario = await _context.InventarioProductos
            .FirstOrDefaultAsync(i => i.BodegaId == request.BodegaId && i.ProductoId == request.ProductoId)
            ?? throw new InventarioInvalidoException("No hay inventario registrado para este producto.");

        inventario.CantidadDisponible = request.CantidadDisponible;

        await _context.SaveChangesAsync();

        return new InventarioItemResponse(producto.Id, producto.Nombre, inventario.CantidadDisponible);
    }
}
