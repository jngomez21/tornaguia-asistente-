using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Infrastructure.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

/// <summary>Herramienta de conteo flexible para el bot gerencial: filtros combinables por año, mes, tipo, departamento y usuario.</summary>
public class CasoUsoContarSolicitudes : ICasoUsoContarSolicitudes
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoContarSolicitudes(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<ContarSolicitudesResponse> EjecutarAsync(ContarSolicitudesRequest request)
    {
        var solicitudesQuery = _context.Solicitudes.AsQueryable();
        var productosQuery = _context.SolicitudesProductos.AsQueryable();

        if (request.Anio is not null)
        {
            var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(request.Anio.Value);
            solicitudesQuery = solicitudesQuery.Where(s => s.FechaSolicitud >= desde && s.FechaSolicitud < hasta);
            productosQuery = productosQuery.Where(sp => sp.Solicitud.FechaSolicitud >= desde && sp.Solicitud.FechaSolicitud < hasta);
        }

        if (request.Mes is not null)
        {
            solicitudesQuery = solicitudesQuery.Where(s => s.FechaSolicitud.AddHours(-5).Month == request.Mes);
            productosQuery = productosQuery.Where(sp => sp.Solicitud.FechaSolicitud.AddHours(-5).Month == request.Mes);
        }

        if (request.Tipo is not null)
        {
            solicitudesQuery = solicitudesQuery.Where(s => s.TipoTornaguia.Nombre == request.Tipo);
            productosQuery = productosQuery.Where(sp => sp.Solicitud.TipoTornaguia.Nombre == request.Tipo);
        }

        if (request.DepartamentoId is not null)
        {
            // Cantidad (tráfico) por origen; impuesto (fiscal) por destino — ver ImpuestoConsumoQueries.
            solicitudesQuery = solicitudesQuery.FiltrarPorDepartamento(request.DepartamentoId, CriterioDepartamento.Origen);
            productosQuery = productosQuery.FiltrarPorDepartamento(request.DepartamentoId, CriterioDepartamento.Destino);
        }

        if (request.UsuarioId is not null)
        {
            solicitudesQuery = solicitudesQuery.Where(s => s.UsuarioId == request.UsuarioId);
            productosQuery = productosQuery.Where(sp => sp.Solicitud.UsuarioId == request.UsuarioId);
        }

        var cantidad = await solicitudesQuery.CountAsync();
        var impuesto = await productosQuery.SumAsync(sp => (decimal?)sp.ValorImpuestoConsumo) ?? 0m;

        return new ContarSolicitudesResponse(cantidad, impuesto);
    }
}
