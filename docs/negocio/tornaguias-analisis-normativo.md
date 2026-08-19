# Análisis normativo — Tipos de tornaguía

Consolidado del análisis de negocio realizado durante el diseño del proyecto.
Fuente: Decreto 1625 de 2016 (arts. 2.2.1.3.3, 2.2.1.3.5, 2.2.1.3.6), Decreto
162 de 2024 (art. 2.2.1.3.9 — codificación), información operativa de
Infoconsumos, y estructura de codificación propuesta por la FND (SIANCO).

## 1. Marco legal — solo 3 tipos existen legalmente

El Decreto 1625/2016, art. 2.2.1.3.3, confirmado sin cambios por el Decreto
162/2024, define exactamente 3 tipos de tornaguía:

- **Movilización**: transporte entre entidades territoriales (departamentos)
  distintas, donde el producto **aún no ha causado** el impuesto y su destino
  es consumo en el departamento de destino.
- **Reenvío**: transporte entre entidades territoriales distintas, donde el
  producto **ya fue declarado/causado** en el departamento de origen.
- **Tránsito**: transporte al interior de la misma entidad territorial
  (incluso si la ruta física cruza la jurisdicción de otra entidad), o
  transporte hacia otro país / destinado a exportación, o entre aduanas y
  zonas francas.

No existen "Tránsito Declaración" ni "Tránsito Local" como tipos legales
separados — son figuras operativas de Infoconsumos, explicadas en la sección 3.

## 2. Codificación SIANCO (Decreto 162/2024, art. 2.2.1.3.9)

El decreto delega en la Federación Nacional de Departamentos (FND) la
definición de la estructura del código de la tornaguía. La FND propuso un
código de 13 dígitos donde el campo "Tipo de tornaguía" (1 dígito) tiene 7
valores:

| Código | Significado | Corresponde a |
|---|---|---|
| 1 | Movilización | Movilización (legal) |
| 2 | Reenvío | Reenvío (legal) |
| 3 | Tránsito (genérico) | Tránsito (legal) |
| 4 | Tránsito al interior de la entidad territorial | Tránsito, variante "interior" |
| 5 | Tránsito por jurisdicción de otra entidad territorial | Tránsito, variante "otra jurisdicción" |
| 6 | Tránsito hacia otro país o destinado a exportación | Tránsito, variante "exportación" |
| 7 | Tránsito entre aduanas, zonas francas | Tránsito, variante "aduanas/ZF" — **fuera de alcance del proyecto** |

**Importante:** los códigos 4-7 no son tipos legales nuevos — son un desglose
de codificación de la FND para trazabilidad en SIANCO, todos ellos bajo el
paraguas legal de "Tránsito". El motor de reglas del proyecto solo determina
1 de los 3 tipos legales; el código específico de Tránsito (4/5/6/7) es
metadata derivada, no una decisión del motor de reglas.

## 3. Figuras operativas de Infoconsumos (no aparecen en ningún decreto)

- **Tránsito Local**: variante interna de "Tránsito interior" (código 4),
  aplicable solo cuando el producto específico no requiere estampillado en
  ese departamento (ej. cerveza Bavaria en Santander). No es un tipo de
  tornaguía distinto — simplifica el formulario (omite campos de
  señalización), pero el resultado sigue siendo Tránsito. Modelado como
  `ExcepcionTransitoLocal` (departamento + producto opcional), consultable
  para ajustar el formulario, sin afectar el árbol de decisión.

## 4. Árbol de decisión del motor de reglas (versión final)

Ver también `docs/diagramas/arbol-decision-motor-reglas.svg`.

```
¿Es para exportación? (país destino seleccionado, o checkbox marcado)
├── SÍ → TRÁNSITO
└── NO
    └── ¿Origen y destino: mismo departamento?
        ├── NO (interdepartamental)
        │   └── ¿Producto declarado?
        │       ├── NO → MOVILIZACIÓN
        │       └── SÍ → REENVÍO
        └── SÍ → TRÁNSITO
```

Solo 3 variables de entrada: `EsParaExportacion`, `MismoDepartamento`,
`EstaDeclarado` — todas booleanas. Cobertura exhaustiva y sin ambigüedad
(verificado con 5 tests unitarios en `TornaguiaAsistente.Tests`).

### Por qué "cruza otro departamento" no es parte de la decisión

Se confirmó explícitamente que Tránsito aplica igual si la ruta se queda
estrictamente dentro del departamento o si cruza un tercer departamento de
paso (ej. Bucaramanga→Oiba(Boyacá)→Barbosa, ambos extremos en Santander). El
resultado es Tránsito en ambos casos — el detalle de si cruzó o no otro
departamento es descriptivo (deriva de `RutaCalculada.DepartamentosIntermedios`,
calculado por el motor geográfico), útil para mostrar en el formulario o
reportar con el código FND correspondiente (4 ó 5), pero no cambia el
resultado del motor de reglas.

### Por qué "exportación" no se puede inferir solo del destino

Una solicitud con destino un municipio colombiano puede igual tener propósito
de exportación (ej. traslado hacia un puerto, desde donde después saldrá del
país en una operación distinta). Por eso `EsParaExportacion` es una variable
independiente del tipo de destino (`PaisDestinoId` vs `MunicipioDestinoId`):
se marca automáticamente si el destino es un país, o manualmente si el
usuario indica "es para exportación" aunque el destino inmediato sea un
municipio colombiano.

## 5. Casos explícitamente fuera de alcance

- **Código 7 (aduanas/zonas francas)**: requeriría un catálogo de zonas
  francas/aduanas que no forma parte del modelo geográfico actual.
- **Departamentos intermedios para exportación por tierra**: `Pais` no tiene
  coordenadas de referencia, así que el motor geográfico no calcula qué
  departamentos colombianos atraviesa un traslado antes de cruzar la
  frontera. El tipo de tornaguía (Tránsito) se determina correctamente de
  todas formas. Mejora futura: agregar `Point?` a `Pais` con un punto de
  referencia (capital o paso fronterizo principal).
- **RNDC, Fondo-Cuenta, Sianco, Acta de Estampillaje**: procesos documentales
  reales del ecosistema tributario colombiano, mencionados en el Art.
  2.2.1.3.6, pero fuera del alcance de este proyecto (que simula solo la
  determinación del tipo de tornaguía, no el trámite documental completo).

## 6. Confirmación cruzada: productos importados vs. nacionales

Las reglas son idénticas para productos nacionales e importados. Lo único
que cambia es el nombre del evento que marca el estado "declarado":
"declaración" (nacional) vs. "Departamentalización" (importado, posterior al
pago en el Fondo-Cuenta de Impuestos al Consumo de Productos Extranjeros). El
modelo de datos usa el campo neutral `EstaDeclarado`, sin atarlo a un origen
específico del producto.
