using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TornaguiaAsistente.Api.Dtos;
using TornaguiaAsistente.Application.Catalogos;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductosController : ControllerBase
{
    private readonly ICasoUsoListarProductos _casoUsoListar;
    private readonly ICasoUsoCrearProducto _casoUsoCrear;

    public ProductosController(ICasoUsoListarProductos casoUsoListar, ICasoUsoCrearProducto casoUsoCrear)
    {
        _casoUsoListar = casoUsoListar;
        _casoUsoCrear = casoUsoCrear;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductoResponse>>> GetProductos()
    {
        var productos = await _casoUsoListar.EjecutarAsync();
        return Ok(productos);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ProductoResponse>> CrearProducto(CrearProductoRequest request)
    {
        try
        {
            var producto = await _casoUsoCrear.EjecutarAsync(request.Nombre);
            return Ok(producto);
        }
        catch (ProductoInvalidoException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}
