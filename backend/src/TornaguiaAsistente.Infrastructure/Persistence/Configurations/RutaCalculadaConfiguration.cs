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

        builder.HasOne(r => r.PaisDestino)
            .WithMany()
            .HasForeignKey(r => r.PaisDestinoId)
            .OnDelete(DeleteBehavior.Restrict);

        // Dos índices únicos filtrados en vez de uno solo: una fila cachea o bien un destino
        // municipio (MunicipioDestinoId no nulo, PaisDestinoId nulo) o bien un destino país
        // (al revés) — nunca ambos ni ninguno.
        builder.HasIndex(r => new { r.MunicipioOrigenId, r.MunicipioDestinoId })
            .IsUnique()
            .HasFilter("\"MunicipioDestinoId\" IS NOT NULL");

        builder.HasIndex(r => new { r.MunicipioOrigenId, r.PaisDestinoId })
            .IsUnique()
            .HasFilter("\"PaisDestinoId\" IS NOT NULL");
    }
}
