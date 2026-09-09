using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Gerencial;
using TornaguiaAsistente.Infrastructure.Inventario;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Gerencial;

public class CasoUsoObtenerVolumenPorDepartamento : ICasoUsoObtenerVolumenPorDepartamento
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerVolumenPorDepartamento(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<VolumenDepartamentoResponse>> EjecutarAsync(int? anio)
    {
        // Se atribuye al departamento de origen: es donde se causa/recauda el impuesto al consumo.
        var solicitudesQuery = _context.Solicitudes.AsQueryable();
        var productosQuery = _context.SolicitudesProductos.AsQueryable();
        if (anio is not null)
        {
            var (desde, hasta) = ImpuestoConsumoQueries.RangoAnioUtc(anio.Value);
            solicitudesQuery = solicitudesQuery.Where(s => s.FechaSolicitud >= desde && s.FechaSolicitud < hasta);
            productosQuery = productosQuery.Where(sp => sp.Solicitud.FechaSolicitud >= desde && sp.Solicitud.FechaSolicitud < hasta);
        }

        var cantidades = await solicitudesQuery
            .GroupBy(s => s.MunicipioOrigen.DepartamentoId)
            .Select(g => new { DepartamentoId = g.Key, Cantidad = g.Count() })
            .ToDictionaryAsync(x => x.DepartamentoId, x => x.Cantidad);

        var impuestos = await productosQuery
            .GroupBy(sp => sp.Solicitud.MunicipioOrigen.DepartamentoId)
            .Select(g => new { DepartamentoId = g.Key, Impuesto = g.Sum(x => x.ValorImpuestoConsumo) })
            .ToDictionaryAsync(x => x.DepartamentoId, x => x.Impuesto);

        // Todos los departamentos del catálogo, no solo los que tienen movimiento: el mapa
        // coroplético del frontend necesita distinguir "cero" de "sin dato".
        var departamentos = await _context.Departamentos
            .Select(d => new { d.Id, d.Nombre, d.CodigoDane })
            .ToListAsync();

        return departamentos
            .Select(d => new VolumenDepartamentoResponse(
                d.Id,
                d.CodigoDane,
                d.Nombre,
                cantidades.GetValueOrDefault(d.Id),
                impuestos.GetValueOrDefault(d.Id)))
            .ToList();
    }
}
