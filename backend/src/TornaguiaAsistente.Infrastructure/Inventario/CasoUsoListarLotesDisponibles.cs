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

    public async Task<IReadOnlyList<LoteResponse>> EjecutarAsync(int usuarioId)
    {
        var lotes = await _context.Lotes
            .Include(l => l.LoteProductos).ThenInclude(lp => lp.Producto)
            .Where(l => l.UsuarioId == usuarioId && l.Estado == EstadoLote.Reservado)
            .OrderByDescending(l => l.FechaCreacion)
            .ToListAsync();

        return lotes.Select(InventarioAjustes.AResponse).ToList();
    }
}
