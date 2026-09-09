using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Domain.Entities;
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
        var impuestoEnLotesSinUsar = await _context.Lotes
            .Where(l => l.Bodega!.UsuarioId == usuarioId && l.Estado == EstadoLote.Reservado)
            .SelectMany(l => l.LoteProductos)
            .SumAsync(lp => (decimal?)lp.ValorImpuestoConsumo) ?? 0m;

        var impuestoYaCausadoEnReenvios = await _context.Solicitudes
            .Where(s => s.UsuarioId == usuarioId && s.TipoTornaguia.Nombre == "Reenvío")
            .SelectMany(s => s.SolicitudProductos)
            .SumAsync(sp => (decimal?)sp.ValorImpuestoConsumo) ?? 0m;

        var impuestoPorCausar = await _context.Solicitudes
            .Where(s => s.UsuarioId == usuarioId && s.TipoTornaguia.Nombre != "Reenvío")
            .SelectMany(s => s.SolicitudProductos)
            .SumAsync(sp => (decimal?)sp.ValorImpuestoConsumo) ?? 0m;

        return new ResumenImpuestoConsumoResponse(
            ImpuestoEnLotesSinUsar: impuestoEnLotesSinUsar,
            ImpuestoYaCausadoEnReenvios: impuestoYaCausadoEnReenvios,
            ImpuestoPorCausarEnMovilizacionesYTransitos: impuestoPorCausar,
            Total: impuestoEnLotesSinUsar + impuestoYaCausadoEnReenvios + impuestoPorCausar);
    }
}
