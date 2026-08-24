using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Catalogos;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Catalogos;

public class CasoUsoListarPaises : ICasoUsoListarPaises
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoListarPaises(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<PaisResponse>> EjecutarAsync()
    {
        return await _context.Paises
            .OrderBy(p => p.Nombre)
            .Select(p => new PaisResponse(p.Id, p.Nombre, p.CodigoISO))
            .ToListAsync();
    }
}
