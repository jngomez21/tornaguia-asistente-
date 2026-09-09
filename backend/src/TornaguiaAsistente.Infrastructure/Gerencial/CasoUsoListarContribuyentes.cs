using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

public class CasoUsoListarContribuyentes : ICasoUsoListarContribuyentes
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoListarContribuyentes(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<ContribuyenteResumenResponse>> EjecutarAsync(int? anio)
    {
        var solicitudesQuery = _context.Solicitudes.AsQueryable();
        var productosQuery = _context.SolicitudesProductos.AsQueryable();
        if (anio is not null)
        {
            var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(anio.Value);
            solicitudesQuery = solicitudesQuery.Where(s => s.FechaSolicitud >= desde && s.FechaSolicitud < hasta);
            productosQuery = productosQuery.Where(sp => sp.Solicitud.FechaSolicitud >= desde && sp.Solicitud.FechaSolicitud < hasta);
        }

        var tornaguiasPorUsuario = await solicitudesQuery
            .GroupBy(s => s.UsuarioId)
            .Select(g => new { UsuarioId = g.Key, Cantidad = g.Count() })
            .ToDictionaryAsync(x => x.UsuarioId, x => x.Cantidad);

        var impuestoPorUsuario = await productosQuery
            .GroupBy(sp => sp.Solicitud.UsuarioId)
            .Select(g => new { UsuarioId = g.Key, Impuesto = g.Sum(x => x.ValorImpuestoConsumo) })
            .ToDictionaryAsync(x => x.UsuarioId, x => x.Impuesto);

        // Última actividad: siempre histórica completa, sin filtrar por año, aunque el resto de
        // la fila sí respete el filtro (es una señal de "activo o inactivo", no una métrica del año).
        var ultimaActividadPorUsuario = await _context.Solicitudes
            .GroupBy(s => s.UsuarioId)
            .Select(g => new { UsuarioId = g.Key, Ultima = g.Max(s => s.FechaSolicitud) })
            .ToDictionaryAsync(x => x.UsuarioId, x => x.Ultima);

        var contribuyentes = await _context.Usuarios
            .Where(u => u.Rol == RolUsuario.Contribuyente)
            .Select(u => new { u.Id, u.Nombre })
            .ToListAsync();

        return contribuyentes
            .Select(u => new ContribuyenteResumenResponse(
                u.Id,
                u.Nombre,
                tornaguiasPorUsuario.GetValueOrDefault(u.Id),
                impuestoPorUsuario.GetValueOrDefault(u.Id),
                ultimaActividadPorUsuario.TryGetValue(u.Id, out var ultima) ? ultima : (DateTime?)null))
            .OrderByDescending(c => c.Impuesto)
            .ToList();
    }
}
