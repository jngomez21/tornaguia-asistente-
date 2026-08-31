using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornaguiaAsistente.Domain.Entities;

namespace TornaguiaAsistente.Infrastructure.Persistence.Configurations;

public class DeclaracionDepartamentalConfiguration : IEntityTypeConfiguration<DeclaracionDepartamental>
{
    public void Configure(EntityTypeBuilder<DeclaracionDepartamental> builder)
    {
        builder.HasOne(d => d.Lote)
            .WithOne(l => l.DeclaracionDepartamental)
            .HasForeignKey<Lote>(l => l.DeclaracionDepartamentalId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
