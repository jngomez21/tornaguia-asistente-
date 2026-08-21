using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TornaguiaAsistente.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarResultadoSolicitud : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<string>>(
                name: "DepartamentosIntermedios",
                table: "Solicitudes",
                type: "text[]",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "DistanciaKm",
                table: "Solicitudes",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Justificacion",
                table: "Solicitudes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "TiempoEstimadoMinutos",
                table: "Solicitudes",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DepartamentosIntermedios",
                table: "Solicitudes");

            migrationBuilder.DropColumn(
                name: "DistanciaKm",
                table: "Solicitudes");

            migrationBuilder.DropColumn(
                name: "Justificacion",
                table: "Solicitudes");

            migrationBuilder.DropColumn(
                name: "TiempoEstimadoMinutos",
                table: "Solicitudes");
        }
    }
}
