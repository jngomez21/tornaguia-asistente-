namespace TornaguiaAsistente.Application.Solicitudes;

public interface ICasoUsoGuardarPdfTornaguia
{
    Task EjecutarAsync(GuardarPdfTornaguiaRequest request);
}

public record GuardarPdfTornaguiaRequest(int SolicitudId, int UsuarioId, byte[] PdfBytes);
