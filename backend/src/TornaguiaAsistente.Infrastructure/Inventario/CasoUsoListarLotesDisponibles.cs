using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

public class CasoUsoListarLotesDisponibles : ICasoUsoListarLotesDisponibles
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoListarLotesDisponibles(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<LoteResponse>> EjecutarAsync(int usuarioId, int? bodegaId = null)
    {
        var lotes = await _context.Lotes
            .Where(l => l.Bodega != null && l.Bodega.UsuarioId == usuarioId && l.Estado == EstadoLote.Reservado)
            .Where(l => bodegaId == null || l.BodegaId == bodegaId)
            .OrderByDescending(l => l.FechaCreacion)
            .Select(l => new
            {
                l.Id,
                l.Estado,
                l.FechaCreacion,
                Productos = l.LoteProductos
                    .Select(lp => new LoteProductoResponse(lp.ProductoId, lp.Producto.Nombre, lp.Cantidad))
                    .ToList(),
                Declaracion = l.DeclaracionDepartamental == null
                    ? null
                    : new DeclaracionResumen(
                        l.DeclaracionDepartamental.NumeroDeclaracion,
                        l.DeclaracionDepartamental.RemitenteNombre,
                        l.DeclaracionDepartamental.RemitenteIdentificacion)
            })
            .ToListAsync();

        return lotes
            .Select(l => new LoteResponse(
                l.Id,
                InventarioAjustes.NumeroSerie(l.Id),
                l.Estado.ToString(),
                l.FechaCreacion,
                l.Productos,
                l.Declaracion))
            .ToList();
    }
}
