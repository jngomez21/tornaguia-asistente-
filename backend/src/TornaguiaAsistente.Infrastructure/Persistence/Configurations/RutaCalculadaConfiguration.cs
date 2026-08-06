using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornaguiaAsistente.Domain.Entities;

namespace TornaguiaAsistente.Infrastructure.Persistence.Configurations;

public class RutaCalculadaConfiguration : IEntityTypeConfiguration<RutaCalculada>
{
    public void Configure(EntityTypeBuilder<RutaCalculada> builder)
    {
        builder.HasOne(r => r.MunicipioOrigen)
            .WithMany()
            .HasForeignKey(r => r.MunicipioOrigenId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.MunicipioDestino)
            .WithMany()
            .HasForeignKey(r => r.MunicipioDestinoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}