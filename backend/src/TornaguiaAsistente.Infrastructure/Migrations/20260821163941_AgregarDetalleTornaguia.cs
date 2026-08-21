using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TornaguiaAsistente.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarDetalleTornaguia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SolicitudesDetalleTornaguia",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SolicitudId = table.Column<int>(type: "integer", nullable: false),
                    RemitenteNombre = table.Column<string>(type: "text", nullable: false),
                    RemitenteIdentificacion = table.Column<string>(type: "text", nullable: false),
                    DestinatarioNombre = table.Column<string>(type: "text", nullable: false),
                    DestinatarioIdentificacion = table.Column<string>(type: "text", nullable: false),
                    TransportadorNombre = table.Column<string>(type: "text", nullable: false),
                    TransportadorIdentificacion = table.Column<string>(type: "text", nullable: false),
                    PlacaVehiculo = table.Column<string>(type: "text", nullable: false),
                    FechaGeneracion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SolicitudesDetalleTornaguia", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SolicitudesDetalleTornaguia_Solicitudes_SolicitudId",
                        column: x => x.SolicitudId,
                        principalTable: "Solicitudes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudesDetalleTornaguia_SolicitudId",
                table: "SolicitudesDetalleTornaguia",
                column: "SolicitudId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SolicitudesDetalleTornaguia");
        }
    }
}
