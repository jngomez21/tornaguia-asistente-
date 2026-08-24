using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Catalogos;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Catalogos;

public class CasoUsoListarProductos : ICasoUsoListarProductos
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoListarProductos(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<ProductoResponse>> EjecutarAsync()
    {
        return await _context.Productos
            .OrderBy(p => p.Nombre)
            .Select(p => new ProductoResponse(p.Id, p.Nombre))
            .ToListAsync();
    }
}
