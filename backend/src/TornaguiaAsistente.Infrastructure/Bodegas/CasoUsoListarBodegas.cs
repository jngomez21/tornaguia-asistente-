using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Bodegas;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Bodegas;

public class CasoUsoListarBodegas : ICasoUsoListarBodegas
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoListarBodegas(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<BodegaResponse>> EjecutarAsync(int usuarioId)
    {
        var bodegas = await _context.Bodegas
            .Include(b => b.Municipio).ThenInclude(m => m.Departamento)
            .Where(b => b.UsuarioId == usuarioId)
            .OrderBy(b => b.Nombre)
            .Select(b => new
            {
                Bodega = b,
                LotesActivos = b.Lotes.Count(l => l.Estado == EstadoLote.Reservado),
                ProductosDistintos = b.InventarioProductos.Count(i => i.CantidadDisponible > 0),
            })
            .ToListAsync();

        return bodegas
            .Select(x => BodegasAjustes.AResponse(x.Bodega, x.LotesActivos, x.ProductosDistintos))
            .ToList();
    }
}
