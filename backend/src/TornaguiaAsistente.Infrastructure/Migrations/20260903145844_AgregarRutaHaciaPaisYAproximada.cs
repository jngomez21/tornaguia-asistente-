using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace TornaguiaAsistente.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarRutaHaciaPaisYAproximada : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RutasCalculadas_MunicipioOrigenId_MunicipioDestinoId",
                table: "RutasCalculadas");

            // Filas cacheadas como "sin ruta terrestre" (Geometria = null, sentinela del mecanismo
            // anterior a este cambio). Ahora toda ruta siempre tiene geometría (real o línea recta
            // aproximada, ver EsAproximada), así que Geometria pasa a ser NOT NULL; estas filas se
            // recalcularán solas la próxima vez que se pidan, ya con el fallback de línea recta.
            migrationBuilder.Sql(@"DELETE FROM ""RutasCalculadas"" WHERE ""Geometria"" IS NULL;");

            migrationBuilder.AddColumn<bool>(
                name: "EsAproximada",
                table: "Solicitudes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<int>(
                name: "TiempoEstimadoMinutos",
                table: "RutasCalculadas",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "MunicipioDestinoId",
                table: "RutasCalculadas",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<LineString>(
                name: "Geometria",
                table: "RutasCalculadas",
                type: "geometry",
                nullable: false,
                oldClrType: typeof(LineString),
                oldType: "geometry",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EsAproximada",
                table: "RutasCalculadas",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "PaisDestinoId",
                table: "RutasCalculadas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<Point>(
                name: "PuntoReferencia",
                table: "Paises",
                type: "geometry",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RutasCalculadas_MunicipioOrigenId_MunicipioDestinoId",
                table: "RutasCalculadas",
                columns: new[] { "MunicipioOrigenId", "MunicipioDestinoId" },
                unique: true,
                filter: "\"MunicipioDestinoId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_RutasCalculadas_MunicipioOrigenId_PaisDestinoId",
                table: "RutasCalculadas",
                columns: new[] { "MunicipioOrigenId", "PaisDestinoId" },
                unique: true,
                filter: "\"PaisDestinoId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_RutasCalculadas_PaisDestinoId",
                table: "RutasCalculadas",
                column: "PaisDestinoId");

            migrationBuilder.AddForeignKey(
                name: "FK_RutasCalculadas_Paises_PaisDestinoId",
                table: "RutasCalculadas",
                column: "PaisDestinoId",
                principalTable: "Paises",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RutasCalculadas_Paises_PaisDestinoId",
                table: "RutasCalculadas");

            migrationBuilder.DropIndex(
                name: "IX_RutasCalculadas_MunicipioOrigenId_MunicipioDestinoId",
                table: "RutasCalculadas");

            migrationBuilder.DropIndex(
                name: "IX_RutasCalculadas_MunicipioOrigenId_PaisDestinoId",
                table: "RutasCalculadas");

            migrationBuilder.DropIndex(
                name: "IX_RutasCalculadas_PaisDestinoId",
                table: "RutasCalculadas");

            migrationBuilder.DropColumn(
                name: "EsAproximada",
                table: "Solicitudes");

            migrationBuilder.DropColumn(
                name: "EsAproximada",
                table: "RutasCalculadas");

            migrationBuilder.DropColumn(
                name: "PaisDestinoId",
                table: "RutasCalculadas");

            migrationBuilder.DropColumn(
                name: "PuntoReferencia",
                table: "Paises");

            migrationBuilder.AlterColumn<int>(
                name: "TiempoEstimadoMinutos",
                table: "RutasCalculadas",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "MunicipioDestinoId",
                table: "RutasCalculadas",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<LineString>(
                name: "Geometria",
                table: "RutasCalculadas",
                type: "geometry",
                nullable: true,
                oldClrType: typeof(LineString),
                oldType: "geometry");

            migrationBuilder.CreateIndex(
                name: "IX_RutasCalculadas_MunicipioOrigenId_MunicipioDestinoId",
                table: "RutasCalculadas",
                columns: new[] { "MunicipioOrigenId", "MunicipioDestinoId" },
                unique: true);
        }
    }
}
