using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

public class CasoUsoEditarLote : ICasoUsoEditarLote
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoEditarLote(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<LoteResponse> EjecutarAsync(EditarLoteRequest request)
    {
        var lote = await _context.Lotes
            .Include(l => l.LoteProductos)
            .FirstOrDefaultAsync(l => l.Id == request.LoteId)
            ?? throw new InventarioInvalidoException($"Lote {request.LoteId} no encontrado.");

        if (lote.UsuarioId != request.UsuarioId)
            throw new InventarioInvalidoException("El lote no pertenece al usuario autenticado.");

        if (lote.Estado != EstadoLote.Reservado)
            throw new InventarioInvalidoException("Solo se puede editar un lote en estado Reservado.");

        var cantidadesNuevas = InventarioAjustes.AgruparCantidades(request.Productos);

        await InventarioAjustes.ReponerAsync(_context, request.UsuarioId, lote.LoteProductos);
        await InventarioAjustes.DescontarAsync(_context, request.UsuarioId, cantidadesNuevas);

        _context.LotesProductos.RemoveRange(lote.LoteProductos);
        lote.LoteProductos.Clear();
        foreach (var (productoId, cantidad) in cantidadesNuevas)
            lote.LoteProductos.Add(new LoteProducto { ProductoId = productoId, Cantidad = cantidad });

        await _context.SaveChangesAsync();

        return await InventarioAjustes.ObtenerRespuestaAsync(_context, lote.Id);
    }
}
