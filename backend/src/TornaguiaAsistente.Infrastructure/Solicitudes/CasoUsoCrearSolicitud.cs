using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Geografia;
using TornaguiaAsistente.Application.Solicitudes;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Domain.Reglas;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Solicitudes;

public class CasoUsoCrearSolicitud : ICasoUsoCrearSolicitud
{
    private readonly TornaguiaDbContext _context;
    private readonly IMotorGeografico _motorGeografico;
    private readonly IMotorReglas _motorReglas;

    public CasoUsoCrearSolicitud(
        TornaguiaDbContext context,
        IMotorGeografico motorGeografico,
        IMotorReglas motorReglas)
    {
        _context = context;
        _motorGeografico = motorGeografico;
        _motorReglas = motorReglas;
    }

    public async Task<CrearSolicitudResponse> EjecutarAsync(CrearSolicitudRequest request)
    {
        if (request.MunicipioDestinoId is null && request.PaisDestinoId is null)
            throw new SolicitudInvalidaException("Debe indicar un municipio o un país de destino.");
        if (request.MunicipioDestinoId is not null && request.PaisDestinoId is not null)
            throw new SolicitudInvalidaException("No puede indicar municipio y país de destino al mismo tiempo.");

        var origen = await _context.Municipios.FindAsync(request.MunicipioOrigenId)
            ?? throw new SolicitudInvalidaException($"Municipio de origen {request.MunicipioOrigenId} no encontrado.");

        Municipio? destinoMunicipio = null;
        Pais? destinoPais = null;
        var mismoDepartamento = false;
        double? distanciaKm = null;
        int? tiempoEstimado = null;
        List<string>? departamentosIntermedios = null;
        IReadOnlyList<double[]>? geometria = null;

        if (request.MunicipioDestinoId is not null)
        {
            destinoMunicipio = await _context.Municipios.FindAsync(request.MunicipioDestinoId.Value)
                ?? throw new SolicitudInvalidaException($"Municipio de destino {request.MunicipioDestinoId} no encontrado.");

            if (destinoMunicipio.Id == origen.Id)
                throw new SolicitudInvalidaException("No se requiere tornaguía para traslados dentro del mismo municipio.");

            mismoDepartamento = origen.DepartamentoId == destinoMunicipio.DepartamentoId;

            var ruta = await _motorGeografico.CalcularRutaAsync(origen.Id, destinoMunicipio.Id);
            distanciaKm = ruta.DistanciaKm;
            tiempoEstimado = ruta.TiempoEstimadoMinutos;
            geometria = ruta.Geometria;

            if (ruta.DepartamentosIntermedioIds.Count > 0)
            {
                departamentosIntermedios = await _context.Departamentos
                    .Where(d => ruta.DepartamentosIntermedioIds.Contains(d.Id))
                    .Select(d => d.Nombre)
                    .ToListAsync();
            }
        }
        else
        {
            destinoPais = await _context.Paises.FindAsync(request.PaisDestinoId!.Value)
                ?? throw new SolicitudInvalidaException($"País de destino {request.PaisDestinoId} no encontrado.");
        }

        var evaluacion = new EvaluacionSolicitud(
            EsParaExportacion: request.EsParaExportacion,
            MismoDepartamento: mismoDepartamento,
            EstaDeclarado: request.EstaDeclarado);

        var resultado = _motorReglas.Determinar(evaluacion);

        var tipoTornaguia = await _context.TiposTornaguia
            .FirstOrDefaultAsync(t => t.Nombre == resultado.TipoTornaguiaNombre)
            ?? throw new InvalidOperationException(
                $"Tipo de tornaguía '{resultado.TipoTornaguiaNombre}' no existe en el catálogo.");

        var nombreDestino = destinoMunicipio?.Nombre ?? destinoPais!.Nombre;
        var justificacionCompleta =
            $"{resultado.Justificacion} (Origen: {origen.Nombre}, Destino: {nombreDestino})";

        var solicitud = new Solicitud
        {
            TipoTornaguiaId = tipoTornaguia.Id,
            UsuarioId = request.UsuarioId,
            MunicipioOrigenId = origen.Id,
            MunicipioDestinoId = destinoMunicipio?.Id,
            PaisDestinoId = destinoPais?.Id,
            EstaDeclarado = request.EstaDeclarado,
            EsParaExportacion = request.EsParaExportacion,
            FechaSolicitud = DateTime.UtcNow,
            Justificacion = justificacionCompleta,
            DistanciaKm = distanciaKm,
            TiempoEstimadoMinutos = tiempoEstimado,
            DepartamentosIntermedios = departamentosIntermedios,
        };

        _context.Solicitudes.Add(solicitud);
        await _context.SaveChangesAsync();

        return new CrearSolicitudResponse(
            SolicitudId: solicitud.Id,
            TipoTornaguia: tipoTornaguia.Nombre,
            Justificacion: justificacionCompleta,
            DistanciaKm: distanciaKm,
            TiempoEstimadoMinutos: tiempoEstimado,
            DepartamentosIntermedios: departamentosIntermedios,
            Geometria: geometria);
    }
}