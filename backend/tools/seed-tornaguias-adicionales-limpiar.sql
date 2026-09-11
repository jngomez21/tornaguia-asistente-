-- =====================================================================================
-- Revierte seed-tornaguias-adicionales.sql
--
-- Borra por rango de Id, igual que seed-datos-demo-limpiar.sql. No toca Usuarios, Bodegas ni
-- Productos: este seed no crea ninguno, solo tornaguías sobre contribuyentes ya existentes.
--
-- Ejecutar: podman exec -i tornaguia-db psql -U tornaguia_user -d tornaguia_db < seed-tornaguias-adicionales-limpiar.sql
-- =====================================================================================

\set ON_ERROR_STOP on

BEGIN;

DELETE FROM "SolicitudesProductos"        WHERE "Id" > 1653;
DELETE FROM "SolicitudesDetalleTornaguia" WHERE "Id" > 370;
DELETE FROM "Solicitudes"                 WHERE "Id" > 693;
DELETE FROM "LotesProductos"              WHERE "Id" > 1770;
DELETE FROM "Lotes"                       WHERE "Id" > 724;

COMMIT;
