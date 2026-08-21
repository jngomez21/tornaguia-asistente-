namespace TornaguiaAsistente.Api.Dtos;

public record ProductoDto(int Id, string Nombre);

public record CrearProductoRequest(string Nombre);
