-- Catálogo de productos sujetos a impuesto al consumo en Colombia (Ley 223/1995, art. 202 y ss.:
-- cervezas/sifones/refajos, vinos/aperitivos/licores, cigarrillos/tabaco elaborado).
-- Capacidad: mililitros para bebidas, unidades por cajetilla para cigarrillos/tabaco.
-- Idempotente: no duplica si ya existen (comparación exacta por nombre); actualiza la
-- capacidad si un producto ya existente la tiene en 0 (dato faltante en versiones previas).

INSERT INTO "Productos" ("Nombre", "CodigoUnico", "EsNacional", "Capacidad")
SELECT v.nombre, v.codigo_unico, v.es_nacional, v.capacidad
FROM (VALUES
    ('Cerveza Águila Light', 'CERVEZA_AGUILA_LIGHT', true, 330),
    ('Cerveza Club Colombia', 'CERVEZA_CLUB_COLOMBIA', true, 330),
    ('Cerveza Costeña', 'CERVEZA_COSTENA', true, 330),
    ('Cerveza Pilsen', 'CERVEZA_PILSEN', true, 330),
    ('Refajo Cola y Pola', 'REFAJO_COLA_Y_POLA', true, 330),
    ('Ron Medellín Añejo', 'RON_MEDELLIN_ANEJO', true, 750),
    ('Ron Viejo de Caldas', 'RON_VIEJO_DE_CALDAS', true, 750),
    ('Aguardiente Antioqueño', 'AGUARDIENTE_ANTIOQUENO', true, 750),
    ('Aguardiente Néctar', 'AGUARDIENTE_NECTAR', true, 750),
    ('Aguardiente Cristal', 'AGUARDIENTE_CRISTAL', true, 750),
    ('Whisky Old Parr', 'WHISKY_OLD_PARR', false, 750),
    ('Whisky Buchanan''s', 'WHISKY_BUCHANANS', false, 750),
    ('Vino Casillero del Diablo', 'VINO_CASILLERO_DEL_DIABLO', false, 750),
    ('Vino Santa Rita 120', 'VINO_SANTA_RITA_120', false, 750),
    ('Cigarrillos Marlboro', 'CIGARRILLOS_MARLBORO', false, 20),
    ('Cigarrillos Boston', 'CIGARRILLOS_BOSTON', true, 20),
    ('Tabaco Pielroja', 'TABACO_PIELROJA', true, 20)
) AS v(nombre, codigo_unico, es_nacional, capacidad)
WHERE NOT EXISTS (
    SELECT 1 FROM "Productos" p WHERE p."Nombre" = v.nombre
);

UPDATE "Productos" p
SET "Capacidad" = v.capacidad
FROM (VALUES
    ('Cerveza Águila Light', 330),
    ('Cerveza Club Colombia', 330),
    ('Cerveza Costeña', 330),
    ('Cerveza Pilsen', 330),
    ('Refajo Cola y Pola', 330),
    ('Ron Medellín Añejo', 750),
    ('Ron Viejo de Caldas', 750),
    ('Aguardiente Antioqueño', 750),
    ('Aguardiente Néctar', 750),
    ('Aguardiente Cristal', 750),
    ('Whisky Old Parr', 750),
    ('Whisky Buchanan''s', 750),
    ('Vino Casillero del Diablo', 750),
    ('Vino Santa Rita 120', 750),
    ('Cigarrillos Marlboro', 20),
    ('Cigarrillos Boston', 20),
    ('Tabaco Pielroja', 20)
) AS v(nombre, capacidad)
WHERE p."Nombre" = v.nombre AND p."Capacidad" <= 0;
