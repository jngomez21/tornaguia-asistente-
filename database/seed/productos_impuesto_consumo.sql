-- Catálogo de productos sujetos a impuesto al consumo en Colombia (Ley 223/1995, art. 202 y ss.:
-- cervezas/sifones/refajos, vinos/aperitivos/licores, cigarrillos/tabaco elaborado).
-- Idempotente: no duplica si ya existen (comparación exacta por nombre).

INSERT INTO "Productos" ("Nombre", "CodigoUnico", "EsNacional")
SELECT v.nombre, v.codigo_unico, v.es_nacional
FROM (VALUES
    ('Cerveza Águila Light', 'CERVEZA_AGUILA_LIGHT', true),
    ('Cerveza Club Colombia', 'CERVEZA_CLUB_COLOMBIA', true),
    ('Cerveza Costeña', 'CERVEZA_COSTENA', true),
    ('Cerveza Pilsen', 'CERVEZA_PILSEN', true),
    ('Refajo Cola y Pola', 'REFAJO_COLA_Y_POLA', true),
    ('Ron Medellín Añejo', 'RON_MEDELLIN_ANEJO', true),
    ('Ron Viejo de Caldas', 'RON_VIEJO_DE_CALDAS', true),
    ('Aguardiente Antioqueño', 'AGUARDIENTE_ANTIOQUENO', true),
    ('Aguardiente Néctar', 'AGUARDIENTE_NECTAR', true),
    ('Aguardiente Cristal', 'AGUARDIENTE_CRISTAL', true),
    ('Whisky Old Parr', 'WHISKY_OLD_PARR', false),
    ('Whisky Buchanan''s', 'WHISKY_BUCHANANS', false),
    ('Vino Casillero del Diablo', 'VINO_CASILLERO_DEL_DIABLO', false),
    ('Vino Santa Rita 120', 'VINO_SANTA_RITA_120', false),
    ('Cigarrillos Marlboro', 'CIGARRILLOS_MARLBORO', false),
    ('Cigarrillos Boston', 'CIGARRILLOS_BOSTON', true),
    ('Tabaco Pielroja', 'TABACO_PIELROJA', true)
) AS v(nombre, codigo_unico, es_nacional)
WHERE NOT EXISTS (
    SELECT 1 FROM "Productos" p WHERE p."Nombre" = v.nombre
);
