using Microsoft.EntityFrameworkCore;
using TornaguiaAsistente.Domain.Entities;

namespace TornaguiaAsistente.Infrastructure.Persistence;

public class TornaguiaDbContext : DbContext
{
    public TornaguiaDbContext(DbContextOptions<TornaguiaDbContext> options)
        : base(options)
    {
    }

    public DbSet<Pais> Paises => Set<Pais>();
    public DbSet<Departamento> Departamentos => Set<Departamento>();
    public DbSet<Municipio> Municipios => Set<Municipio>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<TipoTornaguia> TiposTornaguia => Set<TipoTornaguia>();
    public DbSet<ExcepcionTransitoLocal> ExcepcionesTransitoLocal => Set<ExcepcionTransitoLocal>();
    public DbSet<RutaCalculada> RutasCalculadas => Set<RutaCalculada>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Bodega> Bodegas => Set<Bodega>();
    public DbSet<Solicitud> Solicitudes => Set<Solicitud>();
    public DbSet<SolicitudProducto> SolicitudesProductos => Set<SolicitudProducto>();
    public DbSet<SolicitudDetalleTornaguia> SolicitudesDetalleTornaguia => Set<SolicitudDetalleTornaguia>();
    public DbSet<Lote> Lotes => Set<Lote>();
    public DbSet<LoteProducto> LotesProductos => Set<LoteProducto>();
    public DbSet<InventarioProducto> InventarioProductos => Set<InventarioProducto>();
    public DbSet<EntradaInventario> EntradasInventario => Set<EntradaInventario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TornaguiaDbContext).Assembly);
    }
}