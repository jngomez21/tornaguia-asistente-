namespace TornaguiaAsistente.Application.Asistente;

public interface ICasoUsoResponderPregunta
{
    Task<ResponderPreguntaResponse> EjecutarAsync(
        ResponderPreguntaRequest request, CancellationToken cancellationToken = default);
}

public interface ICasoUsoObtenerHistorialConversacion
{
    Task<IReadOnlyList<MensajeAsistenteResponse>> EjecutarAsync(int usuarioId);
}

public record ResponderPreguntaRequest(int UsuarioId, string Pregunta, Guid ConversacionId);
public record ResponderPreguntaResponse(string Respuesta);

public record MensajeAsistenteResponse(string Rol, string Contenido, DateTime FechaCreacion, Guid ConversacionId);

public class AsistenteNoDisponibleException : Exception
{
    public AsistenteNoDisponibleException(string mensaje) : base(mensaje) {}
}
