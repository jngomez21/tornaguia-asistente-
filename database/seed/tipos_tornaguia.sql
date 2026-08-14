-- Catálogo de tipos de tornaguía (3 tipos legales según Decreto 1625/2016, art. 2.2.1.3.3)
-- Idempotente: no duplica si ya existen.

INSERT INTO "TiposTornaguia" ("Nombre")
SELECT v.nombre
FROM (VALUES ('Movilización'), ('Reenvío'), ('Tránsito')) AS v(nombre)
WHERE NOT EXISTS (
    SELECT 1 FROM "TiposTornaguia" t WHERE t."Nombre" = v.nombre
);
