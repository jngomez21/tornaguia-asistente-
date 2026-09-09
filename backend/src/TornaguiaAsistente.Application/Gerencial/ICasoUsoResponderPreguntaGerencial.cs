namespace TornaguiaAsistente.Application.Gerencial;

public interface ICasoUsoResponderPreguntaGerencial
{
    Task<ResponderPreguntaGerencialResponse> EjecutarAsync(
        ResponderPreguntaGerencialRequest request, CancellationToken cancellationToken = default);
}

public record ResponderPreguntaGerencialRequest(int UsuarioId, string Pregunta, Guid ConversacionId);
public record ResponderPreguntaGerencialResponse(string Respuesta);
