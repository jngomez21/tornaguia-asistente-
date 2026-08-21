using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Autenticacion;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Autenticacion;

public class CasoUsoObtenerPreguntaSeguridad : ICasoUsoObtenerPreguntaSeguridad
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoObtenerPreguntaSeguridad(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<PreguntaSeguridadResponse> EjecutarAsync(string email)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == email);

        if (usuario is null)
            throw new UsuarioNoEncontradoException("No existe una cuenta registrada con ese correo.");

        return new PreguntaSeguridadResponse(usuario.PreguntaSeguridad);
    }
}
