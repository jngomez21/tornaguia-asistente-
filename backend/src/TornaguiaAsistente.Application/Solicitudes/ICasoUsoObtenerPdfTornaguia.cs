namespace TornaguiaAsistente.Application.Solicitudes;

public interface ICasoUsoObtenerPdfTornaguia
{
    /// <summary>Verifica siempre que la solicitud pertenezca al usuario. Es el único método que
    /// deben usar las rutas de contribuyente.</summary>
    Task<byte[]> EjecutarAsync(int solicitudId, int usuarioId);

    /// <summary>Sin verificación de dueño: exclusivo del módulo gerencial. El nombre lo dice a
    /// propósito — así saltarse la comprobación nunca puede ocurrir por inercia o por un null
    /// pasado sin querer.</summary>
    Task<byte[]> EjecutarSinVerificarDuenoAsync(int solicitudId);
}
