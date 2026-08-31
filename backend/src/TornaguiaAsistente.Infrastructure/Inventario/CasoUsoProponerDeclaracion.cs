using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Ia;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

public class CasoUsoProponerDeclaracion : ICasoUsoProponerDeclaracion
{
    private readonly TornaguiaDbContext _context;
    private readonly IExtractorDeclaracion _extractor;

    public CasoUsoProponerDeclaracion(TornaguiaDbContext context, IExtractorDeclaracion extractor)
    {
        _context = context;
        _extractor = extractor;
    }

    public async Task<PropuestaDeclaracionResponse> EjecutarAsync(ProponerDeclaracionRequest request)
    {
        var detectado = await _extractor.ExtraerAsync(request.DocumentoBytes, request.DocumentoContentType);

        int? departamentoId = null;
        if (!string.IsNullOrWhiteSpace(detectado.DepartamentoNombreDetectado))
        {
            var nombreDepartamento = detectado.DepartamentoNombreDetectado.Trim().ToUpper();
            departamentoId = await _context.Departamentos
                .Where(d => d.Nombre.ToUpper() == nombreDepartamento)
                .Select(d => (int?)d.Id)
                .FirstOrDefaultAsync();
        }

        var productos = new List<ProductoPropuesto>();
        foreach (var productoDetectado in detectado.Productos)
        {
            var nombreProducto = productoDetectado.NombreDetectado.Trim().ToUpper();
            var coincidencia = await _context.Productos
                .Where(p => p.Nombre.ToUpper() == nombreProducto)
                .Select(p => new { p.Id, p.Capacidad })
                .FirstOrDefaultAsync();

            productos.Add(new ProductoPropuesto(
                NombreDetectado: productoDetectado.NombreDetectado,
                ProductoIdCoincidente: coincidencia?.Id,
                CapacidadCoincidente: coincidencia?.Capacidad,
                Cantidad: productoDetectado.Cantidad,
                CapacidadDetectada: productoDetectado.Capacidad));
        }

        return new PropuestaDeclaracionResponse(
            NumeroDeclaracion: detectado.NumeroDeclaracion,
            DepartamentoId: departamentoId,
            DepartamentoNombreDetectado: detectado.DepartamentoNombreDetectado,
            Periodo: detectado.Periodo,
            RemitenteNombre: detectado.RemitenteNombre,
            RemitenteIdentificacion: detectado.RemitenteIdentificacion,
            Productos: productos);
    }
}
