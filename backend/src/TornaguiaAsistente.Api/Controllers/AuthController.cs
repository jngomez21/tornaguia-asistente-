using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Application.Autenticacion;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ICasoUsoRegistrarUsuario _casoUsoRegistrar;
    private readonly ICasoUsoLogin _casoUsoLogin;
    private readonly ICasoUsoObtenerPreguntaSeguridad _casoUsoPreguntaSeguridad;
    private readonly ICasoUsoRestaurarPassword _casoUsoRestaurarPassword;

    public AuthController(
        ICasoUsoRegistrarUsuario casoUsoRegistrar,
        ICasoUsoLogin casoUsoLogin,
        ICasoUsoObtenerPreguntaSeguridad casoUsoPreguntaSeguridad,
        ICasoUsoRestaurarPassword casoUsoRestaurarPassword)
    {
        _casoUsoRegistrar = casoUsoRegistrar;
        _casoUsoLogin = casoUsoLogin;
        _casoUsoPreguntaSeguridad = casoUsoPreguntaSeguridad;
        _casoUsoRestaurarPassword = casoUsoRestaurarPassword;
    }

    [HttpPost("registro")]
    public async Task<ActionResult<RegistrarUsuarioResponse>> Registro(RegistrarUsuarioRequest request)
    {
        try
        {
            var resultado = await _casoUsoRegistrar.EjecutarAsync(request);
            return Ok(resultado);
        }
        catch (UsuarioYaExisteException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        try
        {
            var resultado = await _casoUsoLogin.EjecutarAsync(request);
            return Ok(resultado);
        }
        catch (CredencialesInvalidasException ex)
        {
            return Unauthorized(new { mensaje = ex.Message });
        }
    }

    [HttpPost("pregunta-seguridad")]
    public async Task<ActionResult<PreguntaSeguridadResponse>> PreguntaSeguridad(PreguntaSeguridadRequest request)
    {
        try
        {
            var resultado = await _casoUsoPreguntaSeguridad.EjecutarAsync(request.Email);
            return Ok(resultado);
        }
        catch (UsuarioNoEncontradoException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
    }

    [HttpPost("restaurar-password")]
    public async Task<IActionResult> RestaurarPassword(RestaurarPasswordRequest request)
    {
        try
        {
            await _casoUsoRestaurarPassword.EjecutarAsync(request);
            return Ok(new { mensaje = "Contraseña actualizada correctamente." });
        }
        catch (UsuarioNoEncontradoException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
        catch (RespuestaSeguridadIncorrectaException ex)
        {
            return Unauthorized(new { mensaje = ex.Message });
        }
    }
}