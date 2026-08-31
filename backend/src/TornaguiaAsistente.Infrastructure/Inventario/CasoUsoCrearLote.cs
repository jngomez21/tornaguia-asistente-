using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

public class CasoUsoCrearLote : ICasoUsoCrearLote
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoCrearLote(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<LoteResponse> EjecutarAsync(CrearLoteRequest request)
    {
        await InventarioAjustes.ObtenerBodegaPropiaAsync(_context, request.BodegaId, request.UsuarioId);

        var cantidades = InventarioAjustes.AgruparCantidades(request.Productos);
        await InventarioAjustes.DescontarAsync(_context, request.BodegaId, cantidades);

        var lote = InventarioAjustes.CrearLoteReservado(_context, request.BodegaId, cantidades);
        await _context.SaveChangesAsync();

        return await InventarioAjustes.ObtenerRespuestaAsync(_context, lote.Id);
    }
}
