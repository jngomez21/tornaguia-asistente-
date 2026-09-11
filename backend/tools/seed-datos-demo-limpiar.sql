-- =====================================================================================
-- Revierte seed-datos-demo.sql
--
-- Borra por rango de Id: todo lo que quedó por encima de la marca de agua que tenía cada tabla
-- justo antes de sembrar. Es más preciso que buscar por convenciones de texto, porque los
-- productos sembrados usan códigos naturales (AGUARDIENTE_LLANERO) y no un prefijo artificial.
--
-- IMPORTANTE: estas marcas corresponden a la base tal como estaba antes de la primera siembra.
-- Si vuelves a sembrar sobre datos ya sembrados, recaptura las marcas primero o este script
-- borrará también lo que hayas creado a mano entre una siembra y otra.
--
-- El orden respeta las claves foráneas: primero lo que depende, después lo que es dependido.
--
-- Ejecutar: podman exec -i tornaguia-db psql -U tornaguia_user -d tornaguia_db < seed-datos-demo-limpiar.sql
-- =====================================================================================

\set ON_ERROR_STOP on

BEGIN;

DELETE FROM "SolicitudesProductos"          WHERE "Id" > 29;
DELETE FROM "SolicitudesDetalleTornaguia"   WHERE "Id" > 21;
DELETE FROM "Solicitudes"                   WHERE "Id" > 53;
DELETE FROM "LotesProductos"                WHERE "Id" > 39;
DELETE FROM "Lotes"                         WHERE "Id" > 28;
DELETE FROM "DeclaracionesDepartamentales"  WHERE "Id" >  8;
DELETE FROM "EntradasInventario"            WHERE "Id" > 31;
DELETE FROM "InventarioProductos"           WHERE "Id" > 27;
DELETE FROM "Bodegas"                       WHERE "Id" > 13;
DELETE FROM "Usuarios"                      WHERE "Id" > 26;
DELETE FROM "Productos"                     WHERE "Id" > 32;

-- Los nombres de los 11 contribuyentes que se renombraron (de "Smoke Test", "Claude Test", etc.
-- a "Distribuidora ...") NO se revierten: ese cambio es independiente del sembrado y deseado.

COMMIT;
