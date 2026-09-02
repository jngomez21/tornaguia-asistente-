namespace TornaguiaAsistente.Application.Catalogos;

public interface ICasoUsoListarMunicipios
{
    Task<IReadOnlyList<MunicipioResponse>> EjecutarAsync();
}

public record MunicipioResponse(int Id, string Nombre, string DepartamentoNombre, double? Latitud, double? Longitud);
