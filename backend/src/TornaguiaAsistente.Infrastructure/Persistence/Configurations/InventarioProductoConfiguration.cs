using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornaguiaAsistente.Domain.Entities;

namespace TornaguiaAsistente.Infrastructure.Persistence.Configurations;

public class InventarioProductoConfiguration : IEntityTypeConfiguration<InventarioProducto>
{
    public void Configure(EntityTypeBuilder<InventarioProducto> builder)
    {
        builder.HasIndex(i => new { i.BodegaId, i.ProductoId }).IsUnique();
    }
}
