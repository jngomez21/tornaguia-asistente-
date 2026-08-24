using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Catalogos;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Catalogos;

public class CasoUsoListarDepartamentos : ICasoUsoListarDepartamentos
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoListarDepartamentos(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<DepartamentoResponse>> EjecutarAsync()
    {
        return await _context.Departamentos
            .OrderBy(d => d.Nombre)
            .Select(d => new DepartamentoResponse(d.Id, d.Nombre, d.CodigoDane))
            .ToListAsync();
    }
}
