using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TornaguiaAsistente.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarDeclaracionDepartamental : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DeclaracionDepartamentalId",
                table: "Lotes",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DeclaracionesDepartamentales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NumeroDeclaracion = table.Column<string>(type: "text", nullable: false),
                    DepartamentoId = table.Column<int>(type: "integer", nullable: false),
                    Periodo = table.Column<string>(type: "text", nullable: false),
                    RemitenteNombre = table.Column<string>(type: "text", nullable: false),
                    RemitenteIdentificacion = table.Column<string>(type: "text", nullable: false),
                    DocumentoBytes = table.Column<byte[]>(type: "bytea", nullable: false),
                    DocumentoNombreArchivo = table.Column<string>(type: "text", nullable: false),
                    DocumentoContentType = table.Column<string>(type: "text", nullable: false),
                    FechaCarga = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeclaracionesDepartamentales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeclaracionesDepartamentales_Departamentos_DepartamentoId",
                        column: x => x.DepartamentoId,
                        principalTable: "Departamentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Lotes_DeclaracionDepartamentalId",
                table: "Lotes",
                column: "DeclaracionDepartamentalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeclaracionesDepartamentales_DepartamentoId",
                table: "DeclaracionesDepartamentales",
                column: "DepartamentoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Lotes_DeclaracionesDepartamentales_DeclaracionDepartamental~",
                table: "Lotes",
                column: "DeclaracionDepartamentalId",
                principalTable: "DeclaracionesDepartamentales",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Lotes_DeclaracionesDepartamentales_DeclaracionDepartamental~",
                table: "Lotes");

            migrationBuilder.DropTable(
                name: "DeclaracionesDepartamentales");

            migrationBuilder.DropIndex(
                name: "IX_Lotes_DeclaracionDepartamentalId",
                table: "Lotes");

            migrationBuilder.DropColumn(
                name: "DeclaracionDepartamentalId",
                table: "Lotes");
        }
    }
}
