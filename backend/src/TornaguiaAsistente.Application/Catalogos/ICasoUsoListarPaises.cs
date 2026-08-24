namespace TornaguiaAsistente.Application.Catalogos;

public interface ICasoUsoListarPaises
{
    Task<IReadOnlyList<PaisResponse>> EjecutarAsync();
}

public record PaisResponse(int Id, string Nombre, string CodigoISO);
