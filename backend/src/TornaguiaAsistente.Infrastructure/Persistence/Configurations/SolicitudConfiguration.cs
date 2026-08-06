using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders; 
using TornaguiaAsistente.Domain.Entities;

namespace TornaguiaAsistente.Infrastructure.Persistence.Configurations;

public class SolicitudCofiguration : IEntityTypeConfiguration<Solicitud>
{
    public void Configure(EntityTypeBuilder<Solicitud> builder)
    {
        builder.HasOne(s => s.MunicipioOrigen)
            .WithMany()
            .HasForeignKey(s => s.MunicipioOrigenId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.MunicipioDestino)
            .WithMany()
            .HasForeignKey(s => s.MunicipioDestinoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.PaisDestino)
            .WithMany()
            .HasForeignKey(s => s.PaisDestinoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(s => s.EstaDeclarado).IsRequired();
    }
}