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

    public async Task<IReadOnlyList<ContribuyenteResumenResponse>> EjecutarAsync(int? anio, int? limite = null, int? departamentoId = null)
    {
        var solicitudesQuery = _context.Solicitudes.AsQueryable();
        var productosQuery = _context.SolicitudesProductos.AsQueryable();
        if (anio is not null)
        {
            var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(anio.Value);
            solicitudesQuery = solicitudesQuery.Where(s => s.FechaSolicitud >= desde && s.FechaSolicitud < hasta);
            productosQuery = productosQuery.Where(sp => sp.Solicitud.FechaSolicitud >= desde && sp.Solicitud.FechaSolicitud < hasta);
        }

        // Regla fija: tornaguías (tráfico) por origen, impuesto (fiscal) por destino — pueden ser
        // subconjuntos de solicitudes distintos del mismo contribuyente, no una elección del usuario.
        solicitudesQuery = solicitudesQuery.FiltrarPorDepartamento(departamentoId, CriterioDepartamento.Origen);
        productosQuery = productosQuery.FiltrarPorDepartamento(departamentoId, CriterioDepartamento.Destino);

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

        var resumenes = contribuyentes
            .Select(u => new ContribuyenteResumenResponse(
                u.Id,
                u.Nombre,
                tornaguiasPorUsuario.GetValueOrDefault(u.Id),
                impuestoPorUsuario.GetValueOrDefault(u.Id),
                ultimaActividadPorUsuario.TryGetValue(u.Id, out var ultima) ? ultima : (DateTime?)null));

        // Acotado a un departamento: solo los que tuvieron movimiento ahí, no los 32 contribuyentes
        // con la mayoría en cero — eso sí tiene sentido para el tablero global (sin departamento).
        if (departamentoId is not null)
            resumenes = resumenes.Where(c => c.Tornaguias > 0);

        return resumenes
            .OrderByDescending(c => c.Impuesto)
            .Take(limite ?? int.MaxValue)
            .ToList();
    }
}
