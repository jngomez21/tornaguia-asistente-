using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

public class CasoUsoCancelarLote : ICasoUsoCancelarLote
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoCancelarLote(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task EjecutarAsync(CancelarLoteRequest request)
    {
        var lote = await _context.Lotes
            .Include(l => l.LoteProductos)
            .FirstOrDefaultAsync(l => l.Id == request.LoteId)
            ?? throw new InventarioInvalidoException($"Lote {request.LoteId} no encontrado.");

        if (lote.UsuarioId != request.UsuarioId)
            throw new InventarioInvalidoException("El lote no pertenece al usuario autenticado.");

        if (lote.Estado != EstadoLote.Reservado)
            throw new InventarioInvalidoException("Solo se puede cancelar un lote en estado Reservado.");

        await InventarioAjustes.ReponerAsync(_context, request.UsuarioId, lote.LoteProductos);
        lote.Estado = EstadoLote.Cancelado;

        await _context.SaveChangesAsync();
    }
}
