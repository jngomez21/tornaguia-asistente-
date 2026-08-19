# ADR-0003: NetTopologySuite como excepción aceptada en Domain

**Fecha:** 2026-08 (formalizado retroactivamente)
**Estado:** Aceptada

## Contexto

`Domain.Departamento` necesita representar límites geográficos reales
(polígonos) para que el motor geográfico determine con precisión qué
departamentos atraviesa una ruta. `Domain.Municipio` necesita coordenadas
puntuales. Esto requiere el paquete `NetTopologySuite`, lo cual entra en
tensión con la regla de que `Domain` no debe tener dependencias externas.

## Decisión

Se acepta `NetTopologySuite` como dependencia de `Domain`, como excepción a
la regla general de "Domain sin paquetes NuGet externos".

## Justificación

Se considera aceptable porque representa un concepto genuino del negocio
(geometría geográfica: un departamento *tiene* un límite espacial, un
municipio *tiene* una ubicación), similar a cómo `Domain` ya usa tipos como
`DateTime` o `decimal` sin que eso comprometa la arquitectura — a diferencia
de una dependencia de infraestructura técnica (EF Core, un cliente HTTP,
Npgsql), que sí debe permanecer estrictamente fuera de `Domain`.

## Consecuencias

- `Domain` deja de ser 100% libre de paquetes NuGet externos.
- Mantiene su independencia de EF Core, PostgreSQL, y cualquier detalle de
  persistencia o infraestructura técnica.
- El mapeo entre estos tipos geométricos y las columnas reales de PostgreSQL
  (`geometry`) se resuelve en `Infrastructure` (vía
  `Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite`), no en `Domain`.
