using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Domain.Impuestos;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

/// <summary>Cantidad y valor de impuesto al consumo de un producto agrupado dentro de un lote.</summary>
internal readonly record struct DatosLoteProducto(decimal Cantidad, decimal ValorImpuestoConsumo);

internal static class InventarioAjustes
{
    /// <summary>
    /// Agrupa por producto y calcula el impuesto al consumo con el valor por defecto del sistema:
    /// se usa para lotes SIN declaracion departamental (el impuesto aun no ha sido causado).
    /// </summary>
    public static Dictionary<int, DatosLoteProducto> AgruparCantidades(IReadOnlyList<LoteProductoRequest> productos)
    {
        if (productos.Count == 0)
            throw new InventarioInvalidoException("El lote debe tener al menos un producto.");

        var agrupado = new Dictionary<int, DatosLoteProducto>();
        foreach (var p in productos)
        {
            if (p.Cantidad <= 0)
                throw new InventarioInvalidoException("La cantidad de cada producto debe ser mayor que cero.");

            var previo = agrupado.GetValueOrDefault(p.ProductoId);
            agrupado[p.ProductoId] = new DatosLoteProducto(
                previo.Cantidad + p.Cantidad,
                previo.ValorImpuestoConsumo + ImpuestoConsumo.CalcularValorLinea(p.Cantidad));
        }

        return agrupado;
    }

    public static async Task DescontarAsync(
        TornaguiaDbContext context, int bodegaId, IReadOnlyDictionary<int, DatosLoteProducto> cantidades)
    {
        var productoIds = cantidades.Keys.ToList();

        var inventarios = await context.InventarioProductos
            .Include(i => i.Producto)
            .Where(i => i.BodegaId == bodegaId && productoIds.Contains(i.ProductoId))
            .ToDictionaryAsync(i => i.ProductoId);

        foreach (var (productoId, datos) in cantidades)
        {
            if (!inventarios.TryGetValue(productoId, out var inventario))
                throw new InventarioInvalidoException(
                    $"No hay inventario registrado para el producto {productoId}.");

            if (inventario.CantidadDisponible < datos.Cantidad)
                throw new InventarioInvalidoException(
                    $"Stock insuficiente de {inventario.Producto.Nombre}: " +
                    $"disponible {inventario.CantidadDisponible}, solicitado {datos.Cantidad}.");

            inventario.CantidadDisponible -= datos.Cantidad;
        }
    }

    public static async Task ReponerAsync(
        TornaguiaDbContext context, int bodegaId, IEnumerable<LoteProducto> loteProductos)
    {
        var lista = loteProductos as IReadOnlyCollection<LoteProducto> ?? loteProductos.ToList();
        var productoIds = lista.Select(lp => lp.ProductoId).ToList();

        var inventarios = await context.InventarioProductos
            .Where(i => i.BodegaId == bodegaId && productoIds.Contains(i.ProductoId))
            .ToDictionaryAsync(i => i.ProductoId);

        foreach (var lp in lista)
        {
            if (!inventarios.TryGetValue(lp.ProductoId, out var inventario))
                throw new InvalidOperationException(
                    $"Inventario no encontrado para el producto {lp.ProductoId}.");

            inventario.CantidadDisponible += lp.Cantidad;
        }
    }

    public static async Task RegistrarEntradaPorTrasladoAsync(
        TornaguiaDbContext context, int bodegaDestinoId, IEnumerable<LoteProducto> loteProductos)
    {
        var lista = loteProductos as IReadOnlyCollection<LoteProducto> ?? loteProductos.ToList();
        var productoIds = lista.Select(lp => lp.ProductoId).ToList();

        var inventarios = await context.InventarioProductos
            .Where(i => i.BodegaId == bodegaDestinoId && productoIds.Contains(i.ProductoId))
            .ToDictionaryAsync(i => i.ProductoId);

        foreach (var lp in lista)
        {
            if (inventarios.TryGetValue(lp.ProductoId, out var inventario))
            {
                inventario.CantidadDisponible += lp.Cantidad;
            }
            else
            {
                inventario = new InventarioProducto
                {
                    BodegaId = bodegaDestinoId,
                    ProductoId = lp.ProductoId,
                    CantidadDisponible = lp.Cantidad,
                };
                context.InventarioProductos.Add(inventario);
                inventarios[lp.ProductoId] = inventario;
            }

            context.EntradasInventario.Add(new EntradaInventario
            {
                BodegaId = bodegaDestinoId,
                ProductoId = lp.ProductoId,
                Cantidad = lp.Cantidad,
                Fecha = DateTime.UtcNow,
            });
        }
    }

    public static Lote CrearLoteReservado(
        TornaguiaDbContext context, int bodegaId, IReadOnlyDictionary<int, DatosLoteProducto> cantidades)
    {
        var lote = new Lote
        {
            BodegaId = bodegaId,
            Estado = EstadoLote.Reservado,
            FechaCreacion = DateTime.UtcNow,
        };

        foreach (var (productoId, datos) in cantidades)
            lote.LoteProductos.Add(new LoteProducto
            {
                ProductoId = productoId,
                Cantidad = datos.Cantidad,
                ValorImpuestoConsumo = datos.ValorImpuestoConsumo,
            });

        context.Lotes.Add(lote);
        return lote;
    }

    public static void AsegurarPropietario(int propietarioReal, int usuarioId, string entidad)
    {
        if (propietarioReal != usuarioId)
            throw new InventarioInvalidoException($"{entidad} no pertenece al usuario autenticado.");
    }

    public static async Task<Bodega> ObtenerBodegaPropiaAsync(TornaguiaDbContext context, int bodegaId, int usuarioId)
    {
        var bodega = await context.Bodegas.FirstOrDefaultAsync(b => b.Id == bodegaId)
            ?? throw new InventarioInvalidoException($"Bodega {bodegaId} no encontrada.");

        AsegurarPropietario(bodega.UsuarioId, usuarioId, "La bodega");

        return bodega;
    }

    public static async Task<Lote> ObtenerLoteReservadoAsync(
        TornaguiaDbContext context, int loteId, int usuarioId, string accion)
    {
        var lote = await context.Lotes
            .Include(l => l.LoteProductos)
            .Include(l => l.Bodega)
            .FirstOrDefaultAsync(l => l.Id == loteId)
            ?? throw new InventarioInvalidoException($"Lote {loteId} no encontrado.");

        AsegurarPropietario(lote.Bodega!.UsuarioId, usuarioId, "El lote");

        if (lote.Estado != EstadoLote.Reservado)
            throw new InventarioInvalidoException($"Solo se puede {accion} un lote en estado Reservado.");

        return lote;
    }

    public static string NumeroSerie(int loteId) => $"LT-{loteId:D6}";

    public static LoteResponse AResponse(Lote lote) => new(
        LoteId: lote.Id,
        NumeroSerie: NumeroSerie(lote.Id),
        Estado: lote.Estado.ToString(),
        FechaCreacion: lote.FechaCreacion,
        Productos: lote.LoteProductos
            .Select(lp => new LoteProductoResponse(lp.ProductoId, lp.Producto.Nombre, lp.Cantidad, lp.ValorImpuestoConsumo))
            .ToList(),
        Declaracion: lote.DeclaracionDepartamental is null
            ? null
            : new DeclaracionResumen(
                lote.DeclaracionDepartamental.NumeroDeclaracion,
                lote.DeclaracionDepartamental.RemitenteNombre,
                lote.DeclaracionDepartamental.RemitenteIdentificacion)
    );

    public static async Task<LoteResponse> ObtenerRespuestaAsync(TornaguiaDbContext context, int loteId)
    {
        var lote = await context.Lotes
            .Include(l => l.LoteProductos).ThenInclude(lp => lp.Producto)
            .Include(l => l.DeclaracionDepartamental)
            .FirstAsync(l => l.Id == loteId);

        return AResponse(lote);
    }
}
