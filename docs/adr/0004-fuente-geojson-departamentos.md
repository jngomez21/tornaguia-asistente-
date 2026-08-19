# ADR-0004: Fuente del GeoJSON de límites departamentales

**Fecha:** 2026-08 (formalizado retroactivamente)
**Estado:** Aceptada

## Contexto

El motor geográfico necesita polígonos reales de los 33 departamentos de
Colombia para calcular, vía PostGIS (`ST_Intersects`), qué departamentos
atraviesa una ruta. La fuente oficial directa (DANE/IGAC) exige descargar
Shapefiles y convertirlos manualmente a un formato utilizable.

## Decisión

Se usa un GeoJSON derivado de shapefiles del DANE, transformado con
herramientas estándar (`ogr2ogr`) y mantenido públicamente por la comunidad
(Gist de John Guerra, ampliamente referenciado en proyectos de datos
abiertos de Colombia). No es la fuente oficial directa.

## Justificación

Dado el plazo de 4 semanas, convertir Shapefiles manualmente no se justifica
frente a una fuente derivada, pública y confiable que ahorra ese paso. La
fuente incluye el código DANE (`DPTO`) de cada departamento, lo que permite
usarlo como identificador robusto (`Departamento.CodigoDane`) en vez de
depender de coincidencia de nombres de texto.

## Consecuencias

- 55 de 1,122 municipios (4.9%) presentan una discrepancia menor (máximo
  ~6 km) entre su coordenada oficial (DIVIPOLA-DANE) y el polígono
  departamental de esta fuente, verificado con `ST_Contains`. Concentrado en
  municipios fronterizos entre departamentos — no representa un error de
  carga, es imprecisión normal de un polígono de terceros.
- El `DepartamentoId` de cada municipio se asigna desde la columna oficial
  del DANE (DIVIPOLA), no desde el cálculo geométrico — por lo tanto estas
  discrepancias no afectan la correctitud de la asignación departamental.
- En un entorno de producción real, se recomendaría migrar a la fuente
  oficial directa del IGAC/DANE.
