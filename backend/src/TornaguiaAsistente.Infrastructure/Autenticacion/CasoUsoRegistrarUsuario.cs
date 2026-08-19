using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Autenticacion;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Autenticacion;

public class CasoUsoRegistrarUsuario : ICasoUsoRegistrarUsuario
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoRegistrarUsuario(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<RegistrarUsuarioResponse> EjecutarAsync(RegistrarUsuarioRequest request)
    {
        var existente = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (existente is not null)
            throw new UsuarioYaExisteException($"Ya existe una cuenta registrada con el correo {request.Email}.");
    
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var usuario = new Usuario
        {
            Nombre = request.Nombre,
            Email = request.Email,
            PasswordHash = passwordHash
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        return new RegistrarUsuarioResponse(usuario.Id, usuario.Nombre, usuario.Email);
    }
}