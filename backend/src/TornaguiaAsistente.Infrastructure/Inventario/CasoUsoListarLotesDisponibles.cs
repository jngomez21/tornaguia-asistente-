using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

public class CasoUsoListarLotesDisponibles : ICasoUsoListarLotesDisponibles
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoListarLotesDisponibles(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<LoteResponse>> EjecutarAsync(int usuarioId, int? bodegaId = null)
    {
        var lotes = await _context.Lotes
            .Include(l => l.LoteProductos).ThenInclude(lp => lp.Producto)
            .Include(l => l.Bodega)
            .Where(l => l.Bodega != null && l.Bodega.UsuarioId == usuarioId && l.Estado == EstadoLote.Reservado)
            .Where(l => bodegaId == null || l.BodegaId == bodegaId)
            .OrderByDescending(l => l.FechaCreacion)
            .ToListAsync();

        return lotes.Select(InventarioAjustes.AResponse).ToList();
    }
}
