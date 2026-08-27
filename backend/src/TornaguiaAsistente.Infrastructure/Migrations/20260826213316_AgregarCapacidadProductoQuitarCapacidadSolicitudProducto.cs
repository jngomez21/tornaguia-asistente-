using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TornaguiaAsistente.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCapacidadProductoQuitarCapacidadSolicitudProducto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Capacidad",
                table: "SolicitudesProductos");

            migrationBuilder.AddColumn<decimal>(
                name: "Capacidad",
                table: "Productos",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Capacidad",
                table: "Productos");

            migrationBuilder.AddColumn<decimal>(
                name: "Capacidad",
                table: "SolicitudesProductos",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
