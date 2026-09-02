using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Bodegas;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Bodegas;

public class CasoUsoEditarBodega : ICasoUsoEditarBodega
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoEditarBodega(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<BodegaResponse> EjecutarAsync(EditarBodegaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            throw new BodegaInvalidaException("El nombre de la bodega es obligatorio.");

        var bodega = await _context.Bodegas
            .Include(b => b.Municipio).ThenInclude(m => m.Departamento)
            .FirstOrDefaultAsync(b => b.Id == request.BodegaId)
            ?? throw new BodegaInvalidaException($"Bodega {request.BodegaId} no encontrada.");

        BodegasAjustes.AsegurarPropietario(bodega.UsuarioId, request.UsuarioId);

        var municipioExiste = await _context.Municipios.AnyAsync(m => m.Id == request.MunicipioId);
        if (!municipioExiste)
            throw new BodegaInvalidaException($"Municipio {request.MunicipioId} no encontrado.");

        bodega.Nombre = request.Nombre.Trim();
        bodega.DireccionEspecifica = string.IsNullOrWhiteSpace(request.DireccionEspecifica) ? null : request.DireccionEspecifica.Trim();
        bodega.UbicacionEspecifica = BodegasAjustes.ConstruirUbicacionEspecifica(request.DireccionLatitud, request.DireccionLongitud);

        if (bodega.MunicipioId != request.MunicipioId)
        {
            bodega.MunicipioId = request.MunicipioId;
            await _context.SaveChangesAsync();
            await _context.Entry(bodega).Reference(b => b.Municipio).LoadAsync();
            await _context.Entry(bodega.Municipio).Reference(m => m.Departamento).LoadAsync();
        }
        else
        {
            await _context.SaveChangesAsync();
        }

        var lotesActivos = await _context.Lotes.CountAsync(l => l.BodegaId == bodega.Id && l.Estado == EstadoLote.Reservado);
        var productosDistintos = await _context.InventarioProductos.CountAsync(i => i.BodegaId == bodega.Id && i.CantidadDisponible > 0);

        return BodegasAjustes.AResponse(bodega, lotesActivos, productosDistintos);
    }
}
