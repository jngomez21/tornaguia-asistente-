using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Bodegas;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Bodegas;

public class CasoUsoCrearBodega : ICasoUsoCrearBodega
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoCrearBodega(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<BodegaResponse> EjecutarAsync(CrearBodegaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            throw new BodegaInvalidaException("El nombre de la bodega es obligatorio.");

        var municipioExiste = await _context.Municipios.AnyAsync(m => m.Id == request.MunicipioId);
        if (!municipioExiste)
            throw new BodegaInvalidaException($"Municipio {request.MunicipioId} no encontrado.");

        var bodega = new Bodega
        {
            UsuarioId = request.UsuarioId,
            MunicipioId = request.MunicipioId,
            Nombre = request.Nombre.Trim(),
        };

        _context.Bodegas.Add(bodega);
        await _context.SaveChangesAsync();

        await _context.Entry(bodega).Reference(b => b.Municipio).LoadAsync();
        await _context.Entry(bodega.Municipio).Reference(m => m.Departamento).LoadAsync();

        return BodegasAjustes.AResponse(bodega, lotesActivos: 0, productosDistintos: 0);
    }
}
