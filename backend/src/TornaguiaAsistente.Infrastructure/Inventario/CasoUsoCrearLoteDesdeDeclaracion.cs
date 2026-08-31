using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Application.Catalogos;
using TornaguiaAsistente.Application.Inventario;
using TornaguiaAsistente.Domain.Entities;
using TornaguiaAsistente.Infrastructure.Persistence;

namespace TornaguiaAsistente.Infrastructure.Inventario;

public class CasoUsoCrearLoteDesdeDeclaracion : ICasoUsoCrearLoteDesdeDeclaracion
{
    private readonly TornaguiaDbContext _context;
    private readonly ICasoUsoCrearProducto _crearProducto;

    public CasoUsoCrearLoteDesdeDeclaracion(TornaguiaDbContext context, ICasoUsoCrearProducto crearProducto)
    {
        _context = context;
        _crearProducto = crearProducto;
    }

    public async Task<LoteResponse> EjecutarAsync(CrearLoteDesdeDeclaracionRequest request)
    {
        await InventarioAjustes.ObtenerBodegaPropiaAsync(_context, request.BodegaId, request.UsuarioId);

        if (request.Productos.Count == 0)
            throw new InventarioInvalidoException("La declaración debe tener al menos un producto.");

        var departamentoExiste = await _context.Departamentos.AnyAsync(d => d.Id == request.DepartamentoId);
        if (!departamentoExiste)
            throw new InventarioInvalidoException($"Departamento {request.DepartamentoId} no encontrado.");

        var cantidades = new Dictionary<int, decimal>();
        foreach (var item in request.Productos)
        {
            if (item.Cantidad <= 0)
                throw new InventarioInvalidoException("La cantidad de cada producto debe ser mayor que cero.");

            var producto = await _crearProducto.EjecutarAsync(item.ProductoNombre, item.Capacidad);
            cantidades[producto.Id] = cantidades.GetValueOrDefault(producto.Id) + item.Cantidad;
        }

        var loteProductosEntrada = cantidades
            .Select(par => new LoteProducto { ProductoId = par.Key, Cantidad = par.Value })
            .ToList();

        await InventarioAjustes.RegistrarEntradaPorTrasladoAsync(_context, request.BodegaId, loteProductosEntrada);
        await _context.SaveChangesAsync();

        await InventarioAjustes.DescontarAsync(_context, request.BodegaId, cantidades);

        var lote = InventarioAjustes.CrearLoteReservado(_context, request.BodegaId, cantidades);

        var declaracion = new DeclaracionDepartamental
        {
            NumeroDeclaracion = request.NumeroDeclaracion,
            DepartamentoId = request.DepartamentoId,
            Periodo = request.Periodo,
            RemitenteNombre = request.RemitenteNombre,
            RemitenteIdentificacion = request.RemitenteIdentificacion,
            DocumentoBytes = request.DocumentoBytes,
            DocumentoNombreArchivo = request.DocumentoNombreArchivo,
            DocumentoContentType = request.DocumentoContentType,
            FechaCarga = DateTime.UtcNow,
        };
        _context.DeclaracionesDepartamentales.Add(declaracion);
        lote.DeclaracionDepartamental = declaracion;

        await _context.SaveChangesAsync();

        return await InventarioAjustes.ObtenerRespuestaAsync(_context, lote.Id);
    }
}
