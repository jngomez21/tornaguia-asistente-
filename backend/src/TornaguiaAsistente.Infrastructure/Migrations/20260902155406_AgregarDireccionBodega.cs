using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace TornaguiaAsistente.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarDireccionBodega : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DireccionEspecifica",
                table: "Bodegas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Point>(
                name: "UbicacionEspecifica",
                table: "Bodegas",
                type: "geometry",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DireccionEspecifica",
                table: "Bodegas");

            migrationBuilder.DropColumn(
                name: "UbicacionEspecifica",
                table: "Bodegas");
        }
    }
}
