using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TornaguiaAsistente.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarEsParaExportacionSolicitud : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EsParaExportacion",
                table: "Solicitudes",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EsParaExportacion",
                table: "Solicitudes");
        }
    }
}
