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

    public async Task<ResumenGerencialResponse> EjecutarAsync(int? anio)
    {
        var solicitudesQuery = _context.Solicitudes.AsQueryable();
        if (anio is not null)
        {
            var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(anio.Value);
            solicitudesQuery = solicitudesQuery.Where(s => s.FechaSolicitud >= desde && s.FechaSolicitud < hasta);
        }

        var totalTornaguias = await solicitudesQuery.CountAsync();

        var impuestoCausado = await ImpuestoConsumoQueries.Causado(_context, usuarioId: null, anio)
            .SumAsync(sp => (decimal?)sp.ValorImpuestoConsumo) ?? 0m;
        var impuestoPorCausar = await ImpuestoConsumoQueries.PorCausar(_context, usuarioId: null, anio)
            .SumAsync(sp => (decimal?)sp.ValorImpuestoConsumo) ?? 0m;

        var totalContribuyentes = await _context.Usuarios.CountAsync(u => u.Rol == RolUsuario.Contribuyente);
        var totalBodegas = await _context.Bodegas.CountAsync();
        var lotesReservados = await _context.Lotes.CountAsync(l => l.Estado == EstadoLote.Reservado);

        var aniosDisponibles = await _context.Solicitudes
            .Select(s => s.FechaSolicitud.AddHours(-5).Year)
            .Distinct()
            .OrderByDescending(y => y)
            .ToListAsync();

        return new ResumenGerencialResponse(
            TotalTornaguias: totalTornaguias,
            ImpuestoCausado: impuestoCausado,
            ImpuestoPorCausar: impuestoPorCausar,
            ImpuestoTotal: impuestoCausado + impuestoPorCausar,
            TotalContribuyentes: totalContribuyentes,
            TotalBodegas: totalBodegas,
            LotesReservados: lotesReservados,
            AniosDisponibles: aniosDisponibles);
    }
}
