using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Infrastructure.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

public class CasoUsoListarDeclaraciones : ICasoUsoListarDeclaraciones
{
    private const int LimiteMaximo = 50;

    private readonly TornaguiaDbContext _context;

    public CasoUsoListarDeclaraciones(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<DeclaracionResumenResponse>> EjecutarAsync(
        int? anio = null, int? departamentoId = null, int? usuarioId = null)
    {
        var query = _context.DeclaracionesDepartamentales.AsQueryable();

        if (anio is not null)
        {
            var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(anio.Value);
            query = query.Where(d => d.FechaCarga >= desde && d.FechaCarga < hasta);
        }
        if (departamentoId is not null)
            query = query.Where(d => d.DepartamentoId == departamentoId);

        // La declaración no guarda UsuarioId: el dueño se alcanza por Lote → Bodega → Usuario.
        // Ambos eslabones son opcionales, así que una declaración todavía no vinculada a un lote
        // (o cuyo lote no tiene bodega) no tiene dueño y queda fuera de este filtro a propósito.
        if (usuarioId is not null)
            query = query.Where(d => d.Lote != null && d.Lote.Bodega != null && d.Lote.Bodega.UsuarioId == usuarioId);

        var declaraciones = await query
            .OrderByDescending(d => d.FechaCarga)
            .Take(LimiteMaximo)
            .Select(d => new
            {
                d.Id,
                d.NumeroDeclaracion,
                DepartamentoNombre = d.Departamento.Nombre,
                d.Periodo,
                d.RemitenteNombre,
                d.FechaCarga,
                TieneDocumento = d.DocumentoBytes.Length > 0,
            })
            .ToListAsync();

        return declaraciones
            .Select(d => new DeclaracionResumenResponse(d.Id, d.NumeroDeclaracion, d.DepartamentoNombre, d.Periodo, d.RemitenteNombre, d.FechaCarga, d.TieneDocumento))
            .ToList();
    }
}
