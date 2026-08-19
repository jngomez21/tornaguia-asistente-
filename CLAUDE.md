# TornaGuía Asistente

Asistente que determina el tipo de tornaguía (certificado tributario de
transporte en Colombia) según origen, destino y estado de declaración.
Proyecto académico, desarrollador único.

Negocio y diagramas: `docs/negocio/`, `docs/diagramas/`. Decisiones de
arquitectura: `docs/adr/`. Consulta esos archivos solo si la tarea lo requiere.

## Stack

.NET 10 + EF Core + PostgreSQL/PostGIS + Podman (no Docker) · React 19 + Vite
+ TS + Tailwind v4 + TanStack Query · Mapbox (rutas backend, mapa frontend) ·
JWT propio + BCrypt.

## Arquitectura (no negociable)

- `Domain` no referencia otros proyectos (excepción: `NetTopologySuite`, ver ADR).
- `Application` define interfaces; `Infrastructure` las implementa. Nunca al revés.
- `IMotorReglas`: completo en `Domain`, sin dependencias.
- `IMotorGeografico`: interfaz en `Application`, implementación (Mapbox/PostGIS)
  en `Infrastructure`. Caché vía Decorator (`MotorGeograficoConCache`).
- Motor de reglas: solo 3 resultados posibles (Movilización/Reenvío/Tránsito).
  Nada más entra al árbol de decisión.
- No agregues capas/abstracciones para problemas hipotéticos.

## Gotchas ya resueltos — no los reintroduzcas

- Swashbuckle 10.x: `OpenApiSecurityScheme` no tiene `.Reference`. Usar
  `AddSecurityRequirement(document => ...)` + `OpenApiSecuritySchemeReference`.
  Namespace `Microsoft.OpenApi` (sin `.Models`).
- JWT necesita `options.MapInboundClaims = false`, o `"sub"` se remapea y
  `User.FindFirst(Sub)` da null silenciosamente.
- Pipeline: `UseCors → UseRateLimiter → UseAuthentication → UseAuthorization → MapControllers`.
- Fijar versión de EF Core explícita en cada proyecto que lo use directo.
  `Npgsql.EntityFrameworkCore.PostgreSQL*` versiona independiente de `Microsoft.*`.
- `migrations add` no aplica nada — siempre seguir con `database update` y
  verificar con `psql -c '\d "Tabla"'`.
- `podman-compose down -v` borra todo el volumen. Usar `stop`/`start`.
- NetTopologySuite: `X`=longitud, `Y`=latitud. Formatear con
  `CultureInfo.InvariantCulture` (coma decimal local rompe URLs externas).
- Secretos (Mapbox, JWT, connection string) van en User Secrets, nunca en
  `appsettings.json`.

## Convenciones

- Español para entidades/DTOs/variables de negocio.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
- Git Bash sobre PowerShell (heredocs y `mkdir -p` con múltiples paths difieren).

## Antes de asumir algo

- Verifica el estado real del código cuando la tarea dependa de él; no asumas que una decisión discutida anteriormente ya fue implementada.
- Usa `git status`, `git log`, `dotnet build`, tests o `psql` de forma selectiva según la tarea.
- No ejecutes verificaciones ni explores archivos que no sean relevantes para la tarea.
- Antes de modificar código, identifica primero los archivos directamente involucrados.
- Amplía la investigación solo si el contexto disponible no es suficiente.

## Uso del contexto

- Trabaja de forma localizada: no explores el repositorio completo salvo que la tarea lo requiera.
- Prefiere búsquedas específicas y lectura selectiva sobre exploración masiva.
- Evita releer archivos ya inspeccionados cuando su contenido siga siendo relevante y no haya razón para pensar que cambiaron.
- No investigues frontend, backend o infraestructura que no estén relacionados con la tarea.
- Consulta `docs/` solo cuando la tarea requiera información que no esté disponible en el código o este archivo.