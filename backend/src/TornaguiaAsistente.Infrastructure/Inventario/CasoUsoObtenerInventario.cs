using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

public class CasoUsoObtenerInventario : ICasoUsoObtenerInventario
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerInventario(TornaguiaDbContext context)
    {
        _context = context;
    }

    public Task<IReadOnlyList<InventarioItemResponse>> EjecutarAsync(int bodegaId, int usuarioId) =>
        InventarioQueries.ObtenerInventarioAsync(_context, bodegaId, usuarioId);

    public Task<IReadOnlyList<InventarioItemResponse>> EjecutarSinVerificarDuenoAsync(int bodegaId) =>
        InventarioQueries.ObtenerInventarioAsync(_context, bodegaId, usuarioId: null);
}
