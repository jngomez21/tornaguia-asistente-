using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TornaguiaAsistente.Domain.Entities;

namespace TornaguiaAsistente.Infrastructure.Persistence.Configurations;

public class SolicitudDetalleTornaguiaConfiguration : IEntityTypeConfiguration<SolicitudDetalleTornaguia>
{
    public void Configure(EntityTypeBuilder<SolicitudDetalleTornaguia> builder)
    {
        builder.HasOne(d => d.Solicitud)
            .WithOne(s => s.DetalleTornaguia)
            .HasForeignKey<SolicitudDetalleTornaguia>(d => d.SolicitudId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(d => d.SolicitudId).IsUnique();
    }
}
