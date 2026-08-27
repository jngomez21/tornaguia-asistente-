namespace TornaguiaAsistente.Application.Bodegas;

public interface ICasoUsoEliminarBodega
{
    Task EjecutarAsync(EliminarBodegaRequest request);
}

public record EliminarBodegaRequest(int BodegaId, int UsuarioId);
