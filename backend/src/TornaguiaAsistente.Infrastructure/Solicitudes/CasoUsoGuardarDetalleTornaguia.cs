using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Solicitudes;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Solicitudes;

public class CasoUsoGuardarDetalleTornaguia : ICasoUsoGuardarDetalleTornaguia
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoGuardarDetalleTornaguia(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<DetalleTornaguiaResponse> EjecutarAsync(GuardarDetalleTornaguiaRequest request)
    {
        var solicitud = await _context.Solicitudes
            .Include(s => s.DetalleTornaguia)
            .FirstOrDefaultAsync(s => s.Id == request.SolicitudId)
            ?? throw new SolicitudInvalidaException($"Solicitud {request.SolicitudId} no encontrada.");

        if (solicitud.UsuarioId != request.UsuarioId)
            throw new SolicitudInvalidaException("La solicitud no pertenece al usuario autenticado.");

        if (solicitud.DetalleTornaguia is not null)
            throw new SolicitudInvalidaException("Esta solicitud ya tiene un detalle de tornaguía generado.");

        if (request.Productos.Count == 0)
            throw new SolicitudInvalidaException("Debe indicar al menos un producto transportado.");

        var productoIds = request.Productos.Select(p => p.ProductoId).Distinct().ToList();
        var productosExistentes = await _context.Productos
            .Where(p => productoIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        foreach (var productoId in productoIds)
        {
            if (!productosExistentes.ContainsKey(productoId))
                throw new SolicitudInvalidaException($"Producto {productoId} no encontrado.");
        }

        var detalle = new SolicitudDetalleTornaguia
        {
            SolicitudId = solicitud.Id,
            RemitenteNombre = request.RemitenteNombre,
            RemitenteIdentificacion = request.RemitenteIdentificacion,
            DestinatarioNombre = request.DestinatarioNombre,
            DestinatarioIdentificacion = request.DestinatarioIdentificacion,
            TransportadorNombre = request.TransportadorNombre,
            TransportadorIdentificacion = request.TransportadorIdentificacion,
            PlacaVehiculo = request.PlacaVehiculo,
            FechaGeneracion = DateTime.UtcNow,
        };

        _context.SolicitudesDetalleTornaguia.Add(detalle);

        foreach (var producto in request.Productos)
        {
            _context.SolicitudesProductos.Add(new SolicitudProducto
            {
                SolicitudId = solicitud.Id,
                ProductoId = producto.ProductoId,
                Cantidad = producto.Cantidad,
                Capacidad = producto.Capacidad,
            });
        }

        await _context.SaveChangesAsync();

        return new DetalleTornaguiaResponse(
            SolicitudId: solicitud.Id,
            RemitenteNombre: detalle.RemitenteNombre,
            RemitenteIdentificacion: detalle.RemitenteIdentificacion,
            DestinatarioNombre: detalle.DestinatarioNombre,
            DestinatarioIdentificacion: detalle.DestinatarioIdentificacion,
            TransportadorNombre: detalle.TransportadorNombre,
            TransportadorIdentificacion: detalle.TransportadorIdentificacion,
            PlacaVehiculo: detalle.PlacaVehiculo,
            FechaGeneracion: detalle.FechaGeneracion,
            Productos: request.Productos
                .Select(p => new ProductoTransportadoResponse(
                    productosExistentes[p.ProductoId].Nombre, p.Cantidad, p.Capacidad))
                .ToList());
    }
}
