-- =====================================================================================
-- Revierte seed-tornaguias-nuevos-departamentos.sql
--
-- A diferencia de los otros dos seeds, este SÍ crea Bodegas (y su inventario) nuevas —
-- pero ningún Usuario ni Producto nuevo.
--
-- Ejecutar: podman exec -i tornaguia-db psql -U tornaguia_user -d tornaguia_db < seed-tornaguias-nuevos-departamentos-limpiar.sql
-- =====================================================================================

\set ON_ERROR_STOP on

BEGIN;

DELETE FROM "SolicitudesProductos"        WHERE "Id" > 2278;
DELETE FROM "SolicitudesDetalleTornaguia" WHERE "Id" > 511;
DELETE FROM "Solicitudes"                 WHERE "Id" > 931;
DELETE FROM "LotesProductos"              WHERE "Id" > 2395;
DELETE FROM "Lotes"                       WHERE "Id" > 962;
DELETE FROM "EntradasInventario"          WHERE "Id" > 891;
DELETE FROM "InventarioProductos"         WHERE "Id" > 887;
DELETE FROM "Bodegas"                     WHERE "Id" > 106;

COMMIT;
