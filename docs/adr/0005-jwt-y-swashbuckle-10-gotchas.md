# ADR-0005: Configuración de JWT y Swashbuckle 10.x — decisiones no obvias

**Fecha:** 2026-08 (formalizado retroactivamente)
**Estado:** Aceptada

## Contexto

Dos problemas de configuración, no documentados de forma obvia en la
migración a .NET 10 / Swashbuckle 10.x, causaron sesiones de diagnóstico
largas. Se documentan aquí para no repetir el proceso de descubrimiento.

## Decisión 1 — Sintaxis de seguridad de Swashbuckle 10.x

Con Swashbuckle.AspNetCore 10.x + Microsoft.OpenApi 2.7.5, el patrón clásico
de `AddSecurityRequirement` con `OpenApiSecurityScheme.Reference` ya no
compila (la propiedad `Reference` fue removida, y el namespace de las clases
pasó de `Microsoft.OpenApi.Models` a `Microsoft.OpenApi`).

**Patrón correcto:**

```csharp
options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
{
    [new OpenApiSecuritySchemeReference("Bearer", document)] = []
});
```

`AddSecurityRequirement` ahora espera un delegado
(`Func<OpenApiDocument, OpenApiSecurityRequirement>`), no un objeto directo.

## Decisión 2 — `MapInboundClaims = false` en JWT Bearer

Por defecto, `AddJwtBearer` remapea silenciosamente el claim `"sub"` a
`http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier`
(compatibilidad histórica con WS-Federation). Esto causa que
`User.FindFirst(JwtRegisteredClaimNames.Sub)` devuelva `null` en el
controlador, sin ningún error ni log — el request parece "no autorizado"
aunque el token sea válido y la autenticación en sí funcione correctamente.

**Síntoma característico:** `401 Unauthorized` sin que se disparen los
eventos `OnAuthenticationFailed`/`OnChallenge` del middleware — porque el
middleware de autenticación en sí no falla; el 401 lo genera el propio
código del controlador al no encontrar el claim esperado.

**Solución:** `options.MapInboundClaims = false;` dentro de `AddJwtBearer`.

## Consecuencias

- Ambos patrones quedan fijados en `Program.cs`; si se actualiza Swashbuckle
  o el paquete JWT a una versión mayor en el futuro, revisar si la API
  volvió a cambiar antes de asumir que el código actual sigue siendo válido.
