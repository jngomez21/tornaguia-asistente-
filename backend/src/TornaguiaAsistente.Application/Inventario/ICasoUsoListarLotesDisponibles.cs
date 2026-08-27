namespace TornaguiaAsistente.Application.Inventario;

public interface ICasoUsoListarLotesDisponibles
{
    Task<IReadOnlyList<LoteResponse>> EjecutarAsync(int usuarioId, int? bodegaId = null);
}
