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

    public static BodegaResponse AResponse(Bodega bodega) => new(
        Id: bodega.Id,
        Nombre: bodega.Nombre,
        MunicipioId: bodega.MunicipioId,
        MunicipioNombre: bodega.Municipio.Nombre,
        DepartamentoNombre: bodega.Municipio.Departamento.Nombre,
        Latitud: bodega.Municipio.Ubicacion?.Y,
        Longitud: bodega.Municipio.Ubicacion?.X
    );
}
