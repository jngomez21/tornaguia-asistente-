using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Bodegas;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Bodegas;

public class CasoUsoEliminarBodega : ICasoUsoEliminarBodega
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoEliminarBodega(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task EjecutarAsync(EliminarBodegaRequest request)
    {
        var bodega = await _context.Bodegas
            .Include(b => b.InventarioProductos)
            .Include(b => b.Lotes)
            .FirstOrDefaultAsync(b => b.Id == request.BodegaId)
            ?? throw new BodegaInvalidaException($"Bodega {request.BodegaId} no encontrada.");

        BodegasAjustes.AsegurarPropietario(bodega.UsuarioId, request.UsuarioId);

        if (bodega.InventarioProductos.Any(i => i.CantidadDisponible > 0))
            throw new BodegaInvalidaException(
                "No se puede eliminar una bodega con inventario disponible. Traslada o agota el stock primero.");

        if (bodega.Lotes.Any(l => l.Estado == EstadoLote.Reservado))
            throw new BodegaInvalidaException(
                "No se puede eliminar una bodega con lotes reservados en solicitudes en progreso.");

        // Ningún lote sigue Reservado (ya se validó arriba); solo quedan Vinculado/Cancelado,
        // que deben sobrevivir a la bodega para no perder trazabilidad de tornaguías ya emitidas.
        foreach (var lote in bodega.Lotes)
            lote.BodegaId = null;

        // Las solicitudes históricas que usaron esta bodega como origen/destino también deben
        // sobrevivir: ya guardan el municipio en MunicipioOrigenId/MunicipioDestinoId, así que
        // perder solo la referencia a la bodega no pierde información de la tornaguía emitida.
        var solicitudesRelacionadas = await _context.Solicitudes
            .Where(s => s.BodegaOrigenId == bodega.Id || s.BodegaDestinoId == bodega.Id)
            .ToListAsync();

        foreach (var solicitud in solicitudesRelacionadas)
        {
            if (solicitud.BodegaOrigenId == bodega.Id) solicitud.BodegaOrigenId = null;
            if (solicitud.BodegaDestinoId == bodega.Id) solicitud.BodegaDestinoId = null;
        }

        _context.Bodegas.Remove(bodega);
        await _context.SaveChangesAsync();
    }
}
