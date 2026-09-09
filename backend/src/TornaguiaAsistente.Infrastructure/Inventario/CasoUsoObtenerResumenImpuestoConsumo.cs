using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

public class CasoUsoObtenerResumenImpuestoConsumo : ICasoUsoObtenerResumenImpuestoConsumo
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerResumenImpuestoConsumo(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<ResumenImpuestoConsumoResponse> EjecutarAsync(int usuarioId)
    {
        var impuestoEnLotesSinUsar = await ImpuestoConsumoQueries.LotesSinUsar(_context, usuarioId)
            .SumAsync(lp => (decimal?)lp.ValorImpuestoConsumo) ?? 0m;

        var impuestoYaCausadoEnReenvios = await ImpuestoConsumoQueries.Causado(_context, usuarioId, anio: null)
            .SumAsync(sp => (decimal?)sp.ValorImpuestoConsumo) ?? 0m;

        var impuestoPorCausar = await ImpuestoConsumoQueries.PorCausar(_context, usuarioId, anio: null)
            .SumAsync(sp => (decimal?)sp.ValorImpuestoConsumo) ?? 0m;

        return new ResumenImpuestoConsumoResponse(
            ImpuestoEnLotesSinUsar: impuestoEnLotesSinUsar,
            ImpuestoYaCausadoEnReenvios: impuestoYaCausadoEnReenvios,
            ImpuestoPorCausarEnMovilizacionesYTransitos: impuestoPorCausar,
            Total: impuestoEnLotesSinUsar + impuestoYaCausadoEnReenvios + impuestoPorCausar);
    }
}
