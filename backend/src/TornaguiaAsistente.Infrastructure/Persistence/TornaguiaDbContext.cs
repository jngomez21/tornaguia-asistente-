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
    public DbSet<Solicitud> Solicitudes => Set<Solicitud>();
    public DbSet<SolicitudProducto> SolicitudesProductos => Set<SolicitudProducto>();
    public DbSet<SolicitudDetalleTornaguia> SolicitudesDetalleTornaguia => Set<SolicitudDetalleTornaguia>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TornaguiaDbContext).Assembly);
    }
}