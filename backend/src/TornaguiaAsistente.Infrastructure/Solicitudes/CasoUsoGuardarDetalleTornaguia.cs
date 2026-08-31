using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Solicitudes;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Inventario;
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
            .Include(s => s.TipoTornaguia)
            .FirstOrDefaultAsync(s => s.Id == request.SolicitudId)
            ?? throw new SolicitudInvalidaException($"Solicitud {request.SolicitudId} no encontrada.");

        SolicitudesAjustes.AsegurarPropietario(solicitud.UsuarioId, request.UsuarioId, "La solicitud");

        if (solicitud.DetalleTornaguia is not null)
            throw new SolicitudInvalidaException("Esta solicitud ya tiene un detalle de tornaguía generado.");

        var lote = await _context.Lotes
            .Include(l => l.LoteProductos).ThenInclude(lp => lp.Producto)
            .Include(l => l.Bodega)
            .Include(l => l.DeclaracionDepartamental)
            .FirstOrDefaultAsync(l => l.Id == request.LoteId)
            ?? throw new SolicitudInvalidaException($"Lote {request.LoteId} no encontrado.");

        SolicitudesAjustes.AsegurarPropietario(lote.Bodega!.UsuarioId, request.UsuarioId, "El lote");

        if (lote.Estado != EstadoLote.Reservado)
            throw new SolicitudInvalidaException(
                lote.Estado == EstadoLote.Vinculado
                    ? "Este lote ya fue vinculado a otra solicitud."
                    : "Este lote fue cancelado.");

        var esReenvio = solicitud.TipoTornaguia.Nombre == "Reenvío";
        var tieneDeclaracion = lote.DeclaracionDepartamentalId is not null;

        if (esReenvio && !tieneDeclaracion)
            throw new SolicitudInvalidaException(
                "Esta solicitud es de Reenvío y requiere un lote con declaración departamental asociada.");

        if (!esReenvio && tieneDeclaracion)
            throw new SolicitudInvalidaException(
                "Este lote tiene una declaración departamental asociada; solo puede usarse en una solicitud de Reenvío.");

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
            });
        }

        solicitud.LoteId = lote.Id;
        lote.Estado = EstadoLote.Vinculado;

        if (esReenvio)
            solicitud.NumeroDeclaracionOrigen = lote.DeclaracionDepartamental!.NumeroDeclaracion;

        if (solicitud.BodegaDestinoId is not null)
        {
            await InventarioAjustes.RegistrarEntradaPorTrasladoAsync(
                _context, solicitud.BodegaDestinoId.Value, lote.LoteProductos);
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
            Productos: lote.LoteProductos
                .Select(lp => new ProductoTransportadoResponse(
                    lp.Producto.CodigoUnico, lp.Producto.Nombre, lp.Cantidad, lp.Producto.Capacidad))
                .ToList());
    }
}
