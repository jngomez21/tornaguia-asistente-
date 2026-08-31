using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornaguiaAsistente.Domain.Entities;

namespace TornaguiaAsistente.Infrastructure.Persistence.Configurations;

public class LoteConfiguration : IEntityTypeConfiguration<Lote>
{
    public void Configure(EntityTypeBuilder<Lote> builder)
    {
        builder.HasIndex(l => l.DeclaracionDepartamentalId).IsUnique();
    }
}
