using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TornaguiaAsistente.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarIndiceUnicoRutaCalculada : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RutasCalculadas_MunicipioOrigenId",
                table: "RutasCalculadas");

            // Filas de caché duplicadas por una condición de carrera anterior en
            // MotorGeograficoConCache (dos solicitudes concurrentes al mismo par
            // origen-destino insertaban dos filas). Se conserva solo la más
            // reciente (Id mayor) antes de exigir unicidad.
            migrationBuilder.Sql(
                """
                DELETE FROM "RutasCalculadas" a
                USING "RutasCalculadas" b
                WHERE a."MunicipioOrigenId" = b."MunicipioOrigenId"
                  AND a."MunicipioDestinoId" = b."MunicipioDestinoId"
                  AND a."Id" < b."Id";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_RutasCalculadas_MunicipioOrigenId_MunicipioDestinoId",
                table: "RutasCalculadas",
                columns: new[] { "MunicipioOrigenId", "MunicipioDestinoId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RutasCalculadas_MunicipioOrigenId_MunicipioDestinoId",
                table: "RutasCalculadas");

            migrationBuilder.CreateIndex(
                name: "IX_RutasCalculadas_MunicipioOrigenId",
                table: "RutasCalculadas",
                column: "MunicipioOrigenId");
        }
    }
}
