using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Autenticacion;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

public class CasoUsoObtenerResumenContribuyente : ICasoUsoObtenerResumenContribuyente
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerResumenContribuyente(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<ResumenContribuyenteResponse> EjecutarAsync(int usuarioId, int? anio)
    {
        var usuario = await _context.Usuarios.FindAsync([usuarioId])
            ?? throw new UsuarioNoEncontradoException($"Usuario {usuarioId} no encontrado.");

        var solicitudesQuery = _context.Solicitudes.Where(s => s.UsuarioId == usuarioId);
        var productosQuery = _context.SolicitudesProductos.Where(sp => sp.Solicitud.UsuarioId == usuarioId);
        if (anio is not null)
        {
            var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(anio.Value);
            solicitudesQuery = solicitudesQuery.Where(s => s.FechaSolicitud >= desde && s.FechaSolicitud < hasta);
            productosQuery = productosQuery.Where(sp => sp.Solicitud.FechaSolicitud >= desde && sp.Solicitud.FechaSolicitud < hasta);
        }

        var cantidadPorTipo = await solicitudesQuery
            .GroupBy(s => s.TipoTornaguia.Nombre)
            .Select(g => new { Tipo = g.Key, Cantidad = g.Count() })
            .ToDictionaryAsync(x => x.Tipo, x => x.Cantidad);

        var impuestoPorTipo = await productosQuery
            .GroupBy(sp => sp.Solicitud.TipoTornaguia.Nombre)
            .Select(g => new { Tipo = g.Key, Impuesto = g.Sum(x => x.ValorImpuestoConsumo) })
            .ToDictionaryAsync(x => x.Tipo, x => x.Impuesto);

        var tipos = await _context.TiposTornaguia.Select(t => t.Nombre).ToListAsync();
        var porTipo = tipos
            .Select(tipo => new DistribucionTipoResponse(
                tipo,
                cantidadPorTipo.GetValueOrDefault(tipo),
                impuestoPorTipo.GetValueOrDefault(tipo)))
            .ToList();

        var totalBodegas = await _context.Bodegas.CountAsync(b => b.UsuarioId == usuarioId);
        var lotesReservados = await _context.Lotes
            .CountAsync(l => l.Estado == EstadoLote.Reservado && l.Bodega!.UsuarioId == usuarioId);

        // Recaudado: toda línea de producto ya asociada a una tornaguía emitida (los tres tipos).
        // Por causar: el valor de sus lotes reservados sin usar todavía — inventario quieto, sin
        // año (foto del estado actual), no impuesto de una solicitud ya emitida.
        var impuestoRecaudado = await productosQuery.SumAsync(sp => (decimal?)sp.ValorImpuestoConsumo) ?? 0m;
        var impuestoPorCausar = await ImpuestoConsumoQueries.LotesSinUsar(_context, usuarioId)
            .SumAsync(lp => (decimal?)lp.ValorImpuestoConsumo) ?? 0m;

        return new ResumenContribuyenteResponse(
            UsuarioId: usuario.Id,
            Nombre: usuario.Nombre,
            TotalBodegas: totalBodegas,
            LotesReservados: lotesReservados,
            ImpuestoRecaudado: impuestoRecaudado,
            ImpuestoPorCausar: impuestoPorCausar,
            PorTipo: porTipo);
    }
}
