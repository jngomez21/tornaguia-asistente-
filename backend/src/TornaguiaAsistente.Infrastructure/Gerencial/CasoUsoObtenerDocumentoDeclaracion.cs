using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

public class CasoUsoObtenerDocumentoDeclaracion : ICasoUsoObtenerDocumentoDeclaracion
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerDocumentoDeclaracion(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<DocumentoResponse> EjecutarAsync(int declaracionId)
    {
        var declaracion = await _context.DeclaracionesDepartamentales
            .FirstOrDefaultAsync(d => d.Id == declaracionId)
            ?? throw new InventarioInvalidoException($"Declaración {declaracionId} no encontrada.");

        if (declaracion.DocumentoBytes.Length == 0)
            throw new InventarioInvalidoException("Esta declaración no tiene documento cargado.");

        return new DocumentoResponse(declaracion.DocumentoBytes, declaracion.DocumentoNombreArchivo, declaracion.DocumentoContentType);
    }
}
