using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Api.Dtos;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductosController : ControllerBase
{
    private readonly TornaguiaDbContext _context;

    public ProductosController(TornaguiaDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductoDto>>> GetProductos()
    {
        var productos = await _context.Productos
            .OrderBy(p => p.Nombre)
            .Select(p => new ProductoDto(p.Id, p.Nombre))
            .ToListAsync();

        return Ok(productos);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ProductoDto>> CrearProducto(CrearProductoRequest request)
    {
        var nombre = request.Nombre.Trim();
        if (nombre.Length == 0)
            return BadRequest(new { mensaje = "El nombre del producto es obligatorio." });

        var existente = await _context.Productos
            .FirstOrDefaultAsync(p => p.Nombre.ToUpper() == nombre.ToUpper());

        if (existente is not null)
            return Ok(new ProductoDto(existente.Id, existente.Nombre));

        var producto = new Producto
        {
            Nombre = nombre,
            CodigoUnico = GenerarCodigoUnico(nombre),
            EsNacional = true,
        };

        _context.Productos.Add(producto);
        await _context.SaveChangesAsync();

        return Ok(new ProductoDto(producto.Id, producto.Nombre));
    }

    private static string GenerarCodigoUnico(string nombre)
    {
        var normalizado = nombre.ToUpperInvariant().Normalize(NormalizationForm.FormD);
        var sinDiacriticos = new string(normalizado
            .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            .ToArray());

        var slug = Regex.Replace(sinDiacriticos, "[^A-Z0-9]+", "_").Trim('_');
        var sufijo = Guid.NewGuid().ToString("N")[..6];

        return $"{slug}_{sufijo}";
    }
}
