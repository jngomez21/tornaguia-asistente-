namespace TornaguiaAsistente.Application.Autenticacion;

public interface ICasoUsoRegistrarUsuario
{
    Task<RegistrarUsuarioResponse> EjecutarAsync(RegistrarUsuarioRequest request);
}

public interface ICasoUsoLogin
{
    Task<LoginResponse> EjecutarAsync(LoginRequest request);
}

public record RegistrarUsuarioRequest(string Nombre, string Email, string Password);
public record RegistrarUsuarioResponse(int UsuarioId, string Nombre, string Email);

public record LoginRequest(string Email, string Password);
public record LoginResponse(string Token, int UsuarioId, string Nombre);

public class CredencialesInvalidasException : Exception
{
    public CredencialesInvalidasException(string mensaje) : base(mensaje) {}
}

public class UsuarioYaExisteException : Exception
{
    public UsuarioYaExisteException(string mensaje) : base(mensaje) {}
}