namespace TornaguiaAsistente.Application.Catalogos;

public interface ICasoUsoListarDepartamentos
{
    Task<IReadOnlyList<DepartamentoResponse>> EjecutarAsync();
}

public record DepartamentoResponse(int Id, string Nombre, string CodigoDane);
