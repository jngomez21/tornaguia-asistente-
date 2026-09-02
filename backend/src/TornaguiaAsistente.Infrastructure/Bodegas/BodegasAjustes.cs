using NetTopologySuite.Geometries;
using TornaguiaAsistente.Application.Bodegas;
using TornaguiaAsistente.Domain.Entities;

namespace TornaguiaAsistente.Infrastructure.Bodegas;

internal static class BodegasAjustes
{
    public static void AsegurarPropietario(int propietarioReal, int usuarioId)
    {
        if (propietarioReal != usuarioId)
            throw new BodegaInvalidaException("La bodega no pertenece al usuario autenticado.");
    }

    /// <summary>Construye el punto de la dirección específica a partir de lat/lon sueltos.
    /// Es puramente visual (mapa): no se usa para calcular rutas ni para el motor de reglas.</summary>
    public static Point? ConstruirUbicacionEspecifica(double? latitud, double? longitud)
    {
        if (latitud is null && longitud is null) return null;
        if (latitud is null || longitud is null)
            throw new BodegaInvalidaException("La dirección específica requiere latitud y longitud.");

        var punto = NetTopologySuite.NtsGeometryServices.Instance
            .CreateGeometryFactory(srid: 4326)
            .CreatePoint(new Coordinate(longitud.Value, latitud.Value));
        punto.SRID = 4326;
        return punto;
    }

    public static BodegaResponse AResponse(Bodega bodega, int lotesActivos, int productosDistintos) => new(
        Id: bodega.Id,
        Nombre: bodega.Nombre,
        MunicipioId: bodega.MunicipioId,
        MunicipioNombre: bodega.Municipio.Nombre,
        DepartamentoNombre: bodega.Municipio.Departamento.Nombre,
        DireccionEspecifica: bodega.DireccionEspecifica,
        Latitud: bodega.UbicacionEspecifica?.Y ?? bodega.Municipio.Ubicacion?.Y,
        Longitud: bodega.UbicacionEspecifica?.X ?? bodega.Municipio.Ubicacion?.X,
        LotesActivos: lotesActivos,
        ProductosDistintos: productosDistintos
    );
}
