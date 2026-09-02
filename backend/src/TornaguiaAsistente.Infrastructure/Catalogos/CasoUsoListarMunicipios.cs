using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Catalogos;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Catalogos;

public class CasoUsoListarMunicipios : ICasoUsoListarMunicipios
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoListarMunicipios(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<MunicipioResponse>> EjecutarAsync()
    {
        return await _context.Municipios
            .OrderBy(m => m.Nombre)
            .Select(m => new MunicipioResponse(
                m.Id,
                m.Nombre,
                m.Departamento.Nombre,
                m.Ubicacion == null ? null : m.Ubicacion.Y,
                m.Ubicacion == null ? null : m.Ubicacion.X))
            .ToListAsync();
    }
}
