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
        var entradasDestino = new[]
        {
            request.MunicipioDestinoId is not null,
            request.PaisDestinoId is not null,
            request.BodegaDestinoId is not null,
        }.Count(esInformado => esInformado);

        if (entradasDestino == 0)
            throw new SolicitudInvalidaException("Debe indicar un municipio, país o bodega propia de destino.");
        if (entradasDestino > 1)
            throw new SolicitudInvalidaException("Solo puede indicar un tipo de destino.");

        if (request.MunicipioOrigenId is null && request.BodegaOrigenId is null)
            throw new SolicitudInvalidaException("Debe indicar un municipio o una bodega de origen.");

        int? bodegaOrigenUsuarioId = null;
        int municipioOrigenId;

        if (request.BodegaOrigenId is not null)
        {
            var bodegaOrigen = await _context.Bodegas.FindAsync(request.BodegaOrigenId.Value)
                ?? throw new SolicitudInvalidaException($"Bodega de origen {request.BodegaOrigenId} no encontrada.");
            if (bodegaOrigen.UsuarioId != request.UsuarioId)
                throw new SolicitudInvalidaException("La bodega de origen no pertenece al usuario autenticado.");

            bodegaOrigenUsuarioId = bodegaOrigen.Id;
            municipioOrigenId = bodegaOrigen.MunicipioId;
        }
        else
        {
            municipioOrigenId = request.MunicipioOrigenId!.Value;
        }

        var origen = await _context.Municipios.FindAsync(municipioOrigenId)
            ?? throw new SolicitudInvalidaException($"Municipio de origen {municipioOrigenId} no encontrado.");

        int? bodegaDestinoId = null;
        Municipio? destinoMunicipio = null;
        Pais? destinoPais = null;
        var mismoDepartamento = false;
        double? distanciaKm = null;
        int? tiempoEstimado = null;
        List<string>? departamentosIntermedios = null;
        IReadOnlyList<double[]>? geometria = null;

        if (request.BodegaDestinoId is not null)
        {
            if (request.BodegaDestinoId == bodegaOrigenUsuarioId)
                throw new SolicitudInvalidaException("La bodega de destino no puede ser la misma que la de origen.");

            var bodegaDestino = await _context.Bodegas.FindAsync(request.BodegaDestinoId.Value)
                ?? throw new SolicitudInvalidaException($"Bodega de destino {request.BodegaDestinoId} no encontrada.");
            if (bodegaDestino.UsuarioId != request.UsuarioId)
                throw new SolicitudInvalidaException("La bodega de destino no pertenece al usuario autenticado.");

            bodegaDestinoId = bodegaDestino.Id;
            request = request with { MunicipioDestinoId = bodegaDestino.MunicipioId };
        }

        if (request.MunicipioDestinoId is not null)
        {
            destinoMunicipio = await _context.Municipios.FindAsync(request.MunicipioDestinoId.Value)
                ?? throw new SolicitudInvalidaException($"Municipio de destino {request.MunicipioDestinoId} no encontrado.");

            if (destinoMunicipio.Id == origen.Id)
                throw new SolicitudInvalidaException("No se requiere tornaguía para traslados dentro del mismo municipio.");

            mismoDepartamento = origen.DepartamentoId == destinoMunicipio.DepartamentoId;

            try
            {
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
            catch (SolicitudInvalidaException)
            {
                // No hay ruta terrestre calculable (ej. destinos sin conexión vial como Acandí).
                // El tipo de tornaguía no depende de la ruta, así que se sigue sin distancia/mapa.
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
            BodegaOrigenId = bodegaOrigenUsuarioId,
            BodegaDestinoId = bodegaDestinoId,
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