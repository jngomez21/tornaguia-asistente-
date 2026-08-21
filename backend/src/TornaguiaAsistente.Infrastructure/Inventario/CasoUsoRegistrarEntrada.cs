using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

public class CasoUsoRegistrarEntrada : ICasoUsoRegistrarEntrada
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoRegistrarEntrada(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<InventarioItemResponse> EjecutarAsync(RegistrarEntradaRequest request)
    {
        if (request.Cantidad <= 0)
            throw new InventarioInvalidoException("La cantidad debe ser mayor que cero.");

        var producto = await _context.Productos.FindAsync(request.ProductoId)
            ?? throw new InventarioInvalidoException($"Producto {request.ProductoId} no encontrado.");

        var inventario = await _context.InventarioProductos
            .FirstOrDefaultAsync(i => i.UsuarioId == request.UsuarioId && i.ProductoId == request.ProductoId);

        if (inventario is null)
        {
            inventario = new InventarioProducto
            {
                UsuarioId = request.UsuarioId,
                ProductoId = request.ProductoId,
                CantidadDisponible = request.Cantidad,
            };
            _context.InventarioProductos.Add(inventario);
        }
        else
        {
            inventario.CantidadDisponible += request.Cantidad;
        }

        _context.EntradasInventario.Add(new EntradaInventario
        {
            UsuarioId = request.UsuarioId,
            ProductoId = request.ProductoId,
            Cantidad = request.Cantidad,
            Fecha = DateTime.UtcNow,
        });

        await _context.SaveChangesAsync();

        return new InventarioItemResponse(producto.Id, producto.Nombre, inventario.CantidadDisponible);
    }
}
