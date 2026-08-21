using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Autenticacion;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Autenticacion;

public class CasoUsoRestaurarPassword : ICasoUsoRestaurarPassword
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoRestaurarPassword(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task EjecutarAsync(RestaurarPasswordRequest request)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (usuario is null)
            throw new UsuarioNoEncontradoException("No existe una cuenta registrada con ese correo.");

        var respuestaNormalizada = CasoUsoRegistrarUsuario.NormalizarRespuesta(request.RespuestaSeguridad);

        if (!BCrypt.Net.BCrypt.Verify(respuestaNormalizada, usuario.RespuestaSeguridadHash))
            throw new RespuestaSeguridadIncorrectaException("La respuesta de seguridad no es correcta.");

        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NuevaPassword);
        await _context.SaveChangesAsync();
    }
}
