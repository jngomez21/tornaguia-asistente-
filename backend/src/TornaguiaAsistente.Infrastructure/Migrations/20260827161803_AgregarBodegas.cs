using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TornaguiaAsistente.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarBodegas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EntradasInventario_Usuarios_UsuarioId",
                table: "EntradasInventario");

            migrationBuilder.DropForeignKey(
                name: "FK_InventarioProductos_Usuarios_UsuarioId",
                table: "InventarioProductos");

            migrationBuilder.DropForeignKey(
                name: "FK_Lotes_Usuarios_UsuarioId",
                table: "Lotes");

            migrationBuilder.DropIndex(
                name: "IX_Lotes_UsuarioId",
                table: "Lotes");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Lotes");

            migrationBuilder.RenameColumn(
                name: "UsuarioId",
                table: "InventarioProductos",
                newName: "BodegaId");

            migrationBuilder.RenameIndex(
                name: "IX_InventarioProductos_UsuarioId_ProductoId",
                table: "InventarioProductos",
                newName: "IX_InventarioProductos_BodegaId_ProductoId");

            migrationBuilder.RenameColumn(
                name: "UsuarioId",
                table: "EntradasInventario",
                newName: "BodegaId");

            migrationBuilder.RenameIndex(
                name: "IX_EntradasInventario_UsuarioId",
                table: "EntradasInventario",
                newName: "IX_EntradasInventario_BodegaId");

            migrationBuilder.AddColumn<int>(
                name: "BodegaDestinoId",
                table: "Solicitudes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BodegaOrigenId",
                table: "Solicitudes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BodegaId",
                table: "Lotes",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Bodegas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    MunicipioId = table.Column<int>(type: "integer", nullable: false),
                    Nombre = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bodegas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bodegas_Municipios_MunicipioId",
                        column: x => x.MunicipioId,
                        principalTable: "Municipios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Bodegas_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Solicitudes_BodegaDestinoId",
                table: "Solicitudes",
                column: "BodegaDestinoId");

            migrationBuilder.CreateIndex(
                name: "IX_Solicitudes_BodegaOrigenId",
                table: "Solicitudes",
                column: "BodegaOrigenId");

            migrationBuilder.CreateIndex(
                name: "IX_Lotes_BodegaId",
                table: "Lotes",
                column: "BodegaId");

            migrationBuilder.CreateIndex(
                name: "IX_Bodegas_MunicipioId",
                table: "Bodegas",
                column: "MunicipioId");

            migrationBuilder.CreateIndex(
                name: "IX_Bodegas_UsuarioId",
                table: "Bodegas",
                column: "UsuarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_EntradasInventario_Bodegas_BodegaId",
                table: "EntradasInventario",
                column: "BodegaId",
                principalTable: "Bodegas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_InventarioProductos_Bodegas_BodegaId",
                table: "InventarioProductos",
                column: "BodegaId",
                principalTable: "Bodegas",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Lotes_Bodegas_BodegaId",
                table: "Lotes",
                column: "BodegaId",
                principalTable: "Bodegas",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Solicitudes_Bodegas_BodegaDestinoId",
                table: "Solicitudes",
                column: "BodegaDestinoId",
                principalTable: "Bodegas",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Solicitudes_Bodegas_BodegaOrigenId",
                table: "Solicitudes",
                column: "BodegaOrigenId",
                principalTable: "Bodegas",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EntradasInventario_Bodegas_BodegaId",
                table: "EntradasInventario");

            migrationBuilder.DropForeignKey(
                name: "FK_InventarioProductos_Bodegas_BodegaId",
                table: "InventarioProductos");

            migrationBuilder.DropForeignKey(
                name: "FK_Lotes_Bodegas_BodegaId",
                table: "Lotes");

            migrationBuilder.DropForeignKey(
                name: "FK_Solicitudes_Bodegas_BodegaDestinoId",
                table: "Solicitudes");

            migrationBuilder.DropForeignKey(
                name: "FK_Solicitudes_Bodegas_BodegaOrigenId",
                table: "Solicitudes");

            migrationBuilder.DropTable(
                name: "Bodegas");

            migrationBuilder.DropIndex(
                name: "IX_Solicitudes_BodegaDestinoId",
                table: "Solicitudes");

            migrationBuilder.DropIndex(
                name: "IX_Solicitudes_BodegaOrigenId",
                table: "Solicitudes");

            migrationBuilder.DropIndex(
                name: "IX_Lotes_BodegaId",
                table: "Lotes");

            migrationBuilder.DropColumn(
                name: "BodegaDestinoId",
                table: "Solicitudes");

            migrationBuilder.DropColumn(
                name: "BodegaOrigenId",
                table: "Solicitudes");

            migrationBuilder.DropColumn(
                name: "BodegaId",
                table: "Lotes");

            migrationBuilder.RenameColumn(
                name: "BodegaId",
                table: "InventarioProductos",
                newName: "UsuarioId");

            migrationBuilder.RenameIndex(
                name: "IX_InventarioProductos_BodegaId_ProductoId",
                table: "InventarioProductos",
                newName: "IX_InventarioProductos_UsuarioId_ProductoId");

            migrationBuilder.RenameColumn(
                name: "BodegaId",
                table: "EntradasInventario",
                newName: "UsuarioId");

            migrationBuilder.RenameIndex(
                name: "IX_EntradasInventario_BodegaId",
                table: "EntradasInventario",
                newName: "IX_EntradasInventario_UsuarioId");

            migrationBuilder.AddColumn<int>(
                name: "UsuarioId",
                table: "Lotes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Lotes_UsuarioId",
                table: "Lotes",
                column: "UsuarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_EntradasInventario_Usuarios_UsuarioId",
                table: "EntradasInventario",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_InventarioProductos_Usuarios_UsuarioId",
                table: "InventarioProductos",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Lotes_Usuarios_UsuarioId",
                table: "Lotes",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
