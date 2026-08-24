using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace TornaguiaAsistente.Api.Controllers;

public abstract class ApiControllerBase : ControllerBase, IActionFilter
{
    protected int UsuarioId { get; private set; }

    [NonAction]
    public void OnActionExecuting(ActionExecutingContext context)
    {
        var usuarioIdClaim = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (usuarioIdClaim is null || !int.TryParse(usuarioIdClaim, out var usuarioId))
        {
            context.Result = Unauthorized();
            return;
        }

        UsuarioId = usuarioId;
    }

    [NonAction]
    public void OnActionExecuted(ActionExecutedContext context)
    {
    }
}
