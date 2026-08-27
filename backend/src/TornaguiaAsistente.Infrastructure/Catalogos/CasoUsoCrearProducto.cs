using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Catalogos;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Catalogos;

public class CasoUsoCrearProducto : ICasoUsoCrearProducto
{
    private readonly TornaguiaDbContext _context;

    public CasoUsoCrearProducto(TornaguiaDbContext context)
    {
        _context = context;
    }

    public async Task<ProductoResponse> EjecutarAsync(string nombre, decimal capacidad)
    {
        var nombreLimpio = nombre.Trim();
        if (nombreLimpio.Length == 0)
            throw new ProductoInvalidoException("El nombre del producto es obligatorio.");

        if (capacidad <= 0)
            throw new ProductoInvalidoException("La capacidad debe ser mayor a 0.");

        var existente = await _context.Productos
            .FirstOrDefaultAsync(p => p.Nombre.ToUpper() == nombreLimpio.ToUpper());

        if (existente is not null)
            return new ProductoResponse(existente.Id, existente.Nombre, existente.Capacidad);

        var producto = new Producto
        {
            Nombre = nombreLimpio,
            CodigoUnico = GenerarCodigoUnico(nombreLimpio),
            EsNacional = true,
            Capacidad = capacidad,
        };

        _context.Productos.Add(producto);
        await _context.SaveChangesAsync();

        return new ProductoResponse(producto.Id, producto.Nombre, producto.Capacidad);
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
