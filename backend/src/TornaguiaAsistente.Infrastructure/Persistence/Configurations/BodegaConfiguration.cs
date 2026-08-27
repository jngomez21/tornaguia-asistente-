using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornaguiaAsistente.Domain.Entities;

namespace TornaguiaAsistente.Infrastructure.Persistence.Configurations;

public class BodegaConfiguration : IEntityTypeConfiguration<Bodega>
{
    public void Configure(EntityTypeBuilder<Bodega> builder)
    {
        builder.HasIndex(b => b.UsuarioId);
    }
}
