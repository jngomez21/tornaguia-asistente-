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
        var lote = await InventarioAjustes.ObtenerLoteReservadoAsync(
            _context, request.LoteId, request.UsuarioId, "cancelar");

        await InventarioAjustes.ReponerAsync(_context, request.UsuarioId, lote.LoteProductos);
        lote.Estado = EstadoLote.Cancelado;

        await _context.SaveChangesAsync();
    }
}
