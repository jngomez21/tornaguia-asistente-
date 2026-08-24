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
        var lote = await InventarioAjustes.ObtenerLoteReservadoAsync(
            _context, request.LoteId, request.UsuarioId, "editar");

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
