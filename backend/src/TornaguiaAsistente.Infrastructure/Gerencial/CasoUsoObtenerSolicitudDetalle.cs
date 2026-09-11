using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Application.Solicitudes;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

public class CasoUsoObtenerSolicitudDetalle : ICasoUsoObtenerSolicitudDetalleGerencial
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerSolicitudDetalle(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<SolicitudDetalleGerencialResponse> EjecutarAsync(int solicitudId)
    {
        var solicitud = await _context.Solicitudes
            .Include(s => s.TipoTornaguia)
            .Include(s => s.Usuario)
            .Include(s => s.MunicipioOrigen)
            .Include(s => s.MunicipioDestino)
            .Include(s => s.PaisDestino)
            .Include(s => s.SolicitudProductos).ThenInclude(sp => sp.Producto)
            .Include(s => s.DetalleTornaguia)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == solicitudId)
            ?? throw new SolicitudInvalidaException($"Solicitud {solicitudId} no encontrada.");

        var destino = solicitud.MunicipioDestino?.Nombre ?? solicitud.PaisDestino?.Nombre ?? "—";

        var productos = solicitud.SolicitudProductos
            .Select(sp => new LineaProductoResponse(sp.ProductoId, sp.Producto.Nombre, sp.Cantidad, sp.ValorImpuestoConsumo))
            .ToList();

        var detalle = solicitud.DetalleTornaguia;
        DatosTransporteResponse? transporte = detalle is null
            ? null
            : new DatosTransporteResponse(
                detalle.RemitenteNombre,
                detalle.DestinatarioNombre,
                detalle.TransportadorNombre,
                detalle.PlacaVehiculo,
                detalle.FechaGeneracion);

        return new SolicitudDetalleGerencialResponse(
            SolicitudId: solicitud.Id,
            Fecha: solicitud.FechaSolicitud,
            Tipo: solicitud.TipoTornaguia.Nombre,
            ContribuyenteNombre: solicitud.Usuario.Nombre,
            Origen: solicitud.MunicipioOrigen.Nombre,
            Destino: destino,
            EstaDeclarado: solicitud.EstaDeclarado,
            EsParaExportacion: solicitud.EsParaExportacion,
            NumeroDeclaracionOrigen: solicitud.NumeroDeclaracionOrigen,
            Justificacion: solicitud.Justificacion,
            DistanciaKm: solicitud.DistanciaKm,
            TiempoEstimadoMinutos: solicitud.TiempoEstimadoMinutos,
            EsAproximada: solicitud.EsAproximada,
            DepartamentosIntermedios: solicitud.DepartamentosIntermedios,
            Productos: productos,
            Transporte: transporte,
            TienePdf: detalle?.PdfBytes is { Length: > 0 });
    }
}
