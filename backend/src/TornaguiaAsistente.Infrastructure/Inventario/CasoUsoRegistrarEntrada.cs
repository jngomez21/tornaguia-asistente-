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

        await InventarioAjustes.ObtenerBodegaPropiaAsync(_context, request.BodegaId, request.UsuarioId);

        var producto = await _context.Productos.FindAsync(request.ProductoId)
            ?? throw new InventarioInvalidoException($"Producto {request.ProductoId} no encontrado.");

        var inventario = await _context.InventarioProductos
            .FirstOrDefaultAsync(i => i.BodegaId == request.BodegaId && i.ProductoId == request.ProductoId);

        if (inventario is null)
        {
            inventario = new InventarioProducto
            {
                BodegaId = request.BodegaId,
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
            BodegaId = request.BodegaId,
            ProductoId = request.ProductoId,
            Cantidad = request.Cantidad,
            Fecha = DateTime.UtcNow,
        });

        await _context.SaveChangesAsync();

        return new InventarioItemResponse(producto.Id, producto.Nombre, inventario.CantidadDisponible);
    }
}
