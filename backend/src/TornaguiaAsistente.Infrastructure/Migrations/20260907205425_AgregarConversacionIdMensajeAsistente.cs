using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TornaguiaAsistente.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarConversacionIdMensajeAsistente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ConversacionId",
                table: "MensajesAsistente",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            // Los mensajes existentes se guardaron siempre en pares (usuario, asistente) en una
            // misma llamada; se agrupan aquí en pares consecutivos por Id (orden de inserción) y
            // se les asigna un ConversacionId nuevo y único por par.
            migrationBuilder.Sql("""
                WITH numerados AS (
                    SELECT "Id", "UsuarioId",
                           ((ROW_NUMBER() OVER (PARTITION BY "UsuarioId" ORDER BY "Id")) + 1) / 2 AS par
                    FROM "MensajesAsistente"
                ),
                grupos AS (
                    SELECT DISTINCT "UsuarioId", par, gen_random_uuid() AS conv_id
                    FROM numerados
                )
                UPDATE "MensajesAsistente" m
                SET "ConversacionId" = g.conv_id
                FROM numerados n
                JOIN grupos g ON g."UsuarioId" = n."UsuarioId" AND g.par = n.par
                WHERE m."Id" = n."Id";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConversacionId",
                table: "MensajesAsistente");
        }
    }
}
