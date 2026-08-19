# Diagrama entidad-relación — Tornaguía Asistente

Modelo de datos completo del sistema. Renderizado automáticamente por GitHub
al visualizar este archivo (sintaxis Mermaid).

```mermaid
erDiagram
  DEPARTAMENTO ||--o{ MUNICIPIO : contiene
  DEPARTAMENTO ||--o{ EXCEPCIONTRANSITOLOCAL : aplica
  PRODUCTO |o--o{ EXCEPCIONTRANSITOLOCAL : opcional
  MUNICIPIO ||--o{ RUTACALCULADA : origen
  MUNICIPIO ||--o{ RUTACALCULADA : destino
  MUNICIPIO ||--o{ SOLICITUD : origen
  MUNICIPIO |o--o{ SOLICITUD : destino
  PAIS |o--o{ SOLICITUD : destino_exportacion
  TIPOTORNAGUIA ||--o{ SOLICITUD : resultado
  USUARIO ||--o{ SOLICITUD : realiza
  SOLICITUD ||--o{ SOLICITUDPRODUCTO : incluye
  PRODUCTO ||--o{ SOLICITUDPRODUCTO : referenciado

  DEPARTAMENTO {
    int Id PK
    string Nombre
    string CodigoDane
    multipolygon Limites
  }
  MUNICIPIO {
    int Id PK
    string Nombre
    string CodigoDane
    int DepartamentoId FK
    point Ubicacion
  }
  PAIS {
    int Id PK
    string Nombre
    string CodigoISO
  }
  PRODUCTO {
    int Id PK
    string Nombre
    string CodigoUnico
    bool EsNacional
  }
  TIPOTORNAGUIA {
    int Id PK
    string Nombre
  }
  EXCEPCIONTRANSITOLOCAL {
    int Id PK
    int DepartamentoId FK
    int ProductoId FK
    string Descripcion
  }
  RUTACALCULADA {
    int Id PK
    int MunicipioOrigenId FK
    int MunicipioDestinoId FK
    string DepartamentosIntermedios
    decimal DistanciaKm
    int TiempoEstimadoMinutos
  }
  USUARIO {
    int Id PK
    string Nombre
    string Email
    string PasswordHash
  }
  SOLICITUD {
    int Id PK
    int TipoTornaguiaId FK
    int UsuarioId FK
    int MunicipioOrigenId FK
    int MunicipioDestinoId FK
    int PaisDestinoId FK
    bool EstaDeclarado
    bool EsParaExportacion
    string NumeroDeclaracionOrigen
  }
  SOLICITUDPRODUCTO {
    int Id PK
    int SolicitudId FK
    int ProductoId FK
    decimal Cantidad
    decimal Capacidad
  }
```

## Notas del modelo

- `TipoTornaguia` tiene exactamente 3 filas (Movilización, Reenvío, Tránsito) —
  ver `docs/negocio/arbol-decision-motor-reglas.md`. No representa subtipos de
  Tránsito, que son metadata derivada, no almacenada.
- `Solicitud.MunicipioDestinoId` y `Solicitud.PaisDestinoId` son mutuamente
  excluyentes (validado en `Application`, no se puede expresar a nivel de BD).
- `RutaCalculada` y `Solicitud` usan `Municipio` como nivel de origen/destino,
  no `Departamento` — el departamento se deriva navegando la relación.
- `ExcepcionTransitoLocal.ProductoId` es nullable: la excepción puede aplicar
  a nivel de departamento completo o a un producto específico.
