using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Bodegas;
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
            .ToListAsync();

        return bodegas.Select(BodegasAjustes.AResponse).ToList();
    }
}
