using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Application.Autenticacion;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ICasoUsoRegistrarUsuario _casoUsoRegistrar;
    private readonly ICasoUsoLogin _casoUsoLogin;

    public AuthController(ICasoUsoRegistrarUsuario casoUsoRegistrar, ICasoUsoLogin casoUsoLogin)
    {
        _casoUsoRegistrar = casoUsoRegistrar;
        _casoUsoLogin = casoUsoLogin;
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
}