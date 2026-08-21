using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Domain.Entities;
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
        var cantidades = InventarioAjustes.AgruparCantidades(request.Productos);
        await InventarioAjustes.DescontarAsync(_context, request.UsuarioId, cantidades);

        var lote = new Lote
        {
            UsuarioId = request.UsuarioId,
            Estado = EstadoLote.Reservado,
            FechaCreacion = DateTime.UtcNow,
        };

        foreach (var (productoId, cantidad) in cantidades)
            lote.LoteProductos.Add(new LoteProducto { ProductoId = productoId, Cantidad = cantidad });

        _context.Lotes.Add(lote);
        await _context.SaveChangesAsync();

        return await InventarioAjustes.ObtenerRespuestaAsync(_context, lote.Id);
    }
}
