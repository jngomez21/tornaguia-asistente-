using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

public class CasoUsoObtenerResumenGerencial : ICasoUsoObtenerResumenGerencial
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerResumenGerencial(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<ResumenGerencialResponse> EjecutarAsync(int? anio, int? departamentoId = null)
    {
        var solicitudesQuery = _context.Solicitudes.AsQueryable();
        if (anio is not null)
        {
            var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(anio.Value);
            solicitudesQuery = solicitudesQuery.Where(s => s.FechaSolicitud >= desde && s.FechaSolicitud < hasta);
        }

        // Regla fija, no una preferencia: tornaguías por origen, impuesto por destino.
        solicitudesQuery = solicitudesQuery.FiltrarPorDepartamento(departamentoId, CriterioDepartamento.Origen);

        var totalTornaguias = await solicitudesQuery.CountAsync();

        // Recaudado: toda línea de producto ya asociada a una tornaguía emitida (los tres tipos),
        // por destino. Ya no se separa por tipo aquí — Movilización/Reenvío/Tránsito cuentan igual.
        var productosQuery = _context.SolicitudesProductos.AsQueryable();
        if (anio is not null)
        {
            var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(anio.Value);
            productosQuery = productosQuery.Where(sp => sp.Solicitud.FechaSolicitud >= desde && sp.Solicitud.FechaSolicitud < hasta);
        }

        var impuestoRecaudado = await productosQuery
            .FiltrarPorDepartamento(departamentoId, CriterioDepartamento.Destino)
            .SumAsync(sp => (decimal?)sp.ValorImpuestoConsumo) ?? 0m;

        // Contribuyentes: nacional cuenta el catálogo completo; acotado a un departamento cuenta
        // solo los que tuvieron tráfico de salida ahí (mismo criterio que "tornaguías").
        var totalContribuyentes = departamentoId is null
            ? await _context.Usuarios.CountAsync(u => u.Rol == RolUsuario.Contribuyente)
            : await solicitudesQuery.Select(s => s.UsuarioId).Distinct().CountAsync();

        // Bodegas, lotes reservados e impuesto por causar no salen de origen/destino de una
        // solicitud sino de la ubicación propia de la bodega — un lote sin usar no tiene "destino
        // fiscal" todavía, es inventario quieto en un punto fijo. Sin filtro de año: es una foto
        // del inventario actual, no una métrica histórica.
        var bodegasQuery = _context.Bodegas.AsQueryable();
        var lotesQuery = _context.Lotes.Where(l => l.Estado == EstadoLote.Reservado);
        var lotesSinUsarQuery = ImpuestoConsumoQueries.LotesSinUsar(_context, usuarioId: null);
        if (departamentoId is not null)
        {
            bodegasQuery = bodegasQuery.Where(b => b.Municipio.DepartamentoId == departamentoId);
            lotesQuery = lotesQuery.Where(l => l.Bodega!.Municipio.DepartamentoId == departamentoId);
            lotesSinUsarQuery = lotesSinUsarQuery.Where(lp => lp.Lote.Bodega!.Municipio.DepartamentoId == departamentoId);
        }

        var totalBodegas = await bodegasQuery.CountAsync();
        var lotesReservados = await lotesQuery.CountAsync();
        var impuestoPorCausar = await lotesSinUsarQuery.SumAsync(lp => (decimal?)lp.ValorImpuestoConsumo) ?? 0m;

        var aniosDisponibles = await _context.Solicitudes
            .Select(s => s.FechaSolicitud.AddHours(-5).Year)
            .Distinct()
            .OrderByDescending(y => y)
            .ToListAsync();

        return new ResumenGerencialResponse(
            TotalTornaguias: totalTornaguias,
            ImpuestoRecaudado: impuestoRecaudado,
            ImpuestoPorCausar: impuestoPorCausar,
            ImpuestoEnTornaguias: impuestoRecaudado + impuestoPorCausar,
            TotalContribuyentes: totalContribuyentes,
            TotalBodegas: totalBodegas,
            LotesReservados: lotesReservados,
            AniosDisponibles: aniosDisponibles);
    }
}
