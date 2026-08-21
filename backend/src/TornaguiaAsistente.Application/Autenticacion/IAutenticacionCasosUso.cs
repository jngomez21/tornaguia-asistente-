namespace TornaguiaAsistente.Application.Autenticacion;

public interface ICasoUsoRegistrarUsuario
{
    Task<RegistrarUsuarioResponse> EjecutarAsync(RegistrarUsuarioRequest request);
}

public interface ICasoUsoLogin
{
    Task<LoginResponse> EjecutarAsync(LoginRequest request);
}

public interface ICasoUsoObtenerPreguntaSeguridad
{
    Task<PreguntaSeguridadResponse> EjecutarAsync(string email);
}

public interface ICasoUsoRestaurarPassword
{
    Task EjecutarAsync(RestaurarPasswordRequest request);
}

public record RegistrarUsuarioRequest(string Nombre, string Email, string Password, string PreguntaSeguridad, string RespuestaSeguridad);
public record RegistrarUsuarioResponse(int UsuarioId, string Nombre, string Email);

public record LoginRequest(string Email, string Password);
public record LoginResponse(string Token, int UsuarioId, string Nombre);

public record PreguntaSeguridadRequest(string Email);
public record PreguntaSeguridadResponse(string Pregunta);

public record RestaurarPasswordRequest(string Email, string RespuestaSeguridad, string NuevaPassword);

public class CredencialesInvalidasException : Exception
{
    public CredencialesInvalidasException(string mensaje) : base(mensaje) {}
}

public class UsuarioYaExisteException : Exception
{
    public UsuarioYaExisteException(string mensaje) : base(mensaje) {}
}

public class UsuarioNoEncontradoException : Exception
{
    public UsuarioNoEncontradoException(string mensaje) : base(mensaje) {}
}

public class RespuestaSeguridadIncorrectaException : Exception
{
    public RespuestaSeguridadIncorrectaException(string mensaje) : base(mensaje) {}
}