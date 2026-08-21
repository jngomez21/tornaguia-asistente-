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

        var lote = await _context.Lotes
            .Include(l => l.LoteProductos).ThenInclude(lp => lp.Producto)
            .FirstOrDefaultAsync(l => l.Id == request.LoteId)
            ?? throw new SolicitudInvalidaException($"Lote {request.LoteId} no encontrado.");

        if (lote.UsuarioId != request.UsuarioId)
            throw new SolicitudInvalidaException("El lote no pertenece al usuario autenticado.");

        if (lote.Estado != EstadoLote.Reservado)
            throw new SolicitudInvalidaException(
                lote.Estado == EstadoLote.Vinculado
                    ? "Este lote ya fue vinculado a otra solicitud."
                    : "Este lote fue cancelado.");

        var capacidadesPorProducto = request.Capacidades.ToDictionary(c => c.ProductoId, c => c.Capacidad);

        foreach (var loteProducto in lote.LoteProductos)
        {
            if (!capacidadesPorProducto.ContainsKey(loteProducto.ProductoId))
                throw new SolicitudInvalidaException(
                    $"Debe indicar la capacidad para {loteProducto.Producto.Nombre}.");
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

        foreach (var loteProducto in lote.LoteProductos)
        {
            _context.SolicitudesProductos.Add(new SolicitudProducto
            {
                SolicitudId = solicitud.Id,
                ProductoId = loteProducto.ProductoId,
                Cantidad = loteProducto.Cantidad,
                Capacidad = capacidadesPorProducto[loteProducto.ProductoId],
            });
        }

        solicitud.LoteId = lote.Id;
        lote.Estado = EstadoLote.Vinculado;

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
            Productos: lote.LoteProductos
                .Select(lp => new ProductoTransportadoResponse(
                    lp.Producto.Nombre, lp.Cantidad, capacidadesPorProducto[lp.ProductoId]))
                .ToList());
    }
}
