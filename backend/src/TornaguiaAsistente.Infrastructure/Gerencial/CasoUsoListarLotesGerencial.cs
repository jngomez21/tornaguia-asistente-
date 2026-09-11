using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

/// <summary>
/// Distinta de ICasoUsoListarLotesDisponibles (el bot de contribuyente): esa solo muestra lotes
/// Reservado — la vista gerencial es "nivel operativo completo" y muestra cualquier estado.
/// </summary>
public class CasoUsoListarLotesGerencial : ICasoUsoListarLotesGerencial
{
    private const int LimiteMaximo = 50;

    private readonly TornaguiaDbContext _context;

    public CasoUsoListarLotesGerencial(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<LoteGerencialResponse>> EjecutarAsync(int? usuarioId = null, int? bodegaId = null, string? estado = null)
    {
        var query = _context.Lotes.AsQueryable();

        if (usuarioId is not null)
            query = query.Where(l => l.Bodega != null && l.Bodega.UsuarioId == usuarioId);
        if (bodegaId is not null)
            query = query.Where(l => l.BodegaId == bodegaId);
        if (estado is not null)
        {
            // Un estado que no existe devuelve vacío, no "sin filtrar": si se ignorara el filtro,
            // el bot recibiría todos los lotes creyendo que están filtrados y lo afirmaría.
            if (!Enum.TryParse<EstadoLote>(estado, ignoreCase: true, out var estadoParseado))
                return [];
            query = query.Where(l => l.Estado == estadoParseado);
        }

        var lotes = await query
            .OrderByDescending(l => l.FechaCreacion)
            .Take(LimiteMaximo)
            .Select(l => new
            {
                l.Id,
                l.Estado,
                l.FechaCreacion,
                // Lote.BodegaId es nullable: al listar sin filtrar por usuario pueden aparecer
                // lotes sin bodega, y BodegaNombre no admite null.
                BodegaNombre = l.Bodega != null ? l.Bodega.Nombre : "(sin bodega)",
                Productos = l.LoteProductos
                    .Select(lp => new LineaProductoResponse(lp.ProductoId, lp.Producto.Nombre, lp.Cantidad, lp.ValorImpuestoConsumo))
                    .ToList(),
                NumeroDeclaracion = l.DeclaracionDepartamental != null ? l.DeclaracionDepartamental.NumeroDeclaracion : null,
            })
            .ToListAsync();

        return lotes
            .Select(l => new LoteGerencialResponse(l.Id, l.Estado.ToString(), l.FechaCreacion, l.BodegaNombre, l.Productos, l.NumeroDeclaracion))
            .ToList();
    }
}
