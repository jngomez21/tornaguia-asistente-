using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Asistente;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Asistente;

public class CasoUsoObtenerHistorialConversacion : ICasoUsoObtenerHistorialConversacion
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerHistorialConversacion(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<MensajeAsistenteResponse>> EjecutarAsync(int usuarioId)
    {
        return await _context.MensajesAsistente
            .Where(m => m.UsuarioId == usuarioId)
            .OrderBy(m => m.Id)
            .Select(m => new MensajeAsistenteResponse(m.Rol, m.Contenido, m.FechaCreacion, m.ConversacionId))
            .ToListAsync();
    }
}
