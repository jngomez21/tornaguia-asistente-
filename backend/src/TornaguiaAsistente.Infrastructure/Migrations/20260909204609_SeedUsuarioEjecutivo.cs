using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TornaguiaAsistente.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedUsuarioEjecutivo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Contraseña "1234" y respuesta de seguridad "arroz", ya hasheadas con BCrypt.
            // Credencial de demostración académica: no es un secreto real, por eso vive en el repo.
            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Nombre", "Email", "PasswordHash", "PreguntaSeguridad", "RespuestaSeguridadHash", "Rol" },
                values: new object[]
                {
                    "Gerencia",
                    "gerencia@gmail.com",
                    "$2a$11$3ZmEsYKw0UKKaGKFpIyCWeTQiAAGbpJSn7myTIOV4gBiHtJA6McIG",
                    "¿Cuál es tu comida favorita?",
                    "$2a$11$6mvTMJ.GLJ8lj6.KOV3rsOz2N.k2uKJK6W8H1v18zISwxDPUfiG.K",
                    "Ejecutivo"
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Email",
                keyValue: "gerencia@gmail.com");
        }
    }
}
