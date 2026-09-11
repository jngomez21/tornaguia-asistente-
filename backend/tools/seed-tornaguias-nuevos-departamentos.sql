-- =====================================================================================
-- 20 tornaguías en departamentos donde todavía no se había generado ninguna
--
-- Antes de este seed, 15 departamentos no tenían ni bodegas ni tornaguías (AMAZONAS, ARAUCA,
-- SAN ANDRÉS, CAQUETÁ, CASANARE, CESAR, CHOCÓ, CUNDINAMARCA, GUAINÍA, GUAVIARE, PUTUMAYO,
-- QUINDÍO, RISARALDA, VAUPÉS, VICHADA). Sin una bodega ahí no hay de dónde originar una
-- tornaguía, así que primero se les crea UNA bodega nueva (de un contribuyente ya existente,
-- ninguno nuevo) con su inventario, y de ahí salen las 20 tornaguías.
--
-- A propósito solo se eligen 10 de esos 15 al azar: los otros 5 quedan sin ninguna bodega ni
-- tornaguía, deliberadamente vacíos (pedido explícito, no un olvido).
--
-- Reutiliza el mismo generador de tornaguías de seed-datos-demo.sql / seed-tornaguias-adicionales.sql
-- (motor de reglas, caché de rutas + PostGIS de respaldo, fechas 2023-2026) — ver esos archivos
-- para el detalle de cada decisión. El destino sale del mismo catálogo de ciudades conocidas de
-- siempre (Medellín, Bogotá, Cali, etc.), no de otro departamento vacío.
--
-- Marca de agua antes de sembrar (para revertir con seed-tornaguias-nuevos-departamentos-limpiar.sql):
--   Bodegas <= 106, InventarioProductos <= 887, EntradasInventario <= 891, Solicitudes <= 931,
--   SolicitudesProductos <= 2278, SolicitudesDetalleTornaguia <= 511, Lotes <= 962, LotesProductos <= 2395.
--
-- Ejecutar:  podman exec -i tornaguia-db psql -U tornaguia_user -d tornaguia_db < seed-tornaguias-nuevos-departamentos.sql
-- Revertir:  seed-tornaguias-nuevos-departamentos-limpiar.sql
-- =====================================================================================

\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  candidatos     int[] := ARRAY[28,25,33,7,26,9,12,11,29,30,27,19,20,31,32];
  objetivo       int[];
  bodegas_nuevas int[] := ARRAY[]::int[];
  d              int;
  usuario_id     int;
  mun            int;
  bodega_id      int;
  nombres_bodega text[] := ARRAY['Bodega Central','Bodega Norte','Bodega Sur','Centro de Distribución','Bodega Principal','Almacén Industrial'];

  -- variables del generador de tornaguías (igual que en los otros dos seeds)
  n              int;
  u_nombre       text;
  b_municipio_id int;
  b_departamento_id int;
  es_exportacion boolean;
  pais_id        int;
  mun_destino    int;
  depto_origen   int;
  depto_destino  int;
  mismo_depto    boolean;
  esta_declarado boolean;
  tipo_id        int;
  justif         text;
  nombre_origen  text;
  nombre_destino text;
  anio           int;
  mes            int;
  dia            int;
  fecha          timestamptz;
  r              record;
  ruta_cacheada  boolean;
  recta_km       numeric;
  factor         numeric;
  via_km         numeric;
  kmh            numeric;
  minutos        int;
  aprox          boolean;
  deptos         text[];
  lote_id        int;
  solicitud_id   int;
  decl_id        int;
  decl_numero    text;
  ciudades       int[] := ARRAY[
    1,1,1, 149,149,149, 1007,1007,
    126, 150, 847, 833, 319, 960, 781, 688, 658,
    47, 59, 19, 1033, 821, 606, 362, 429, 934, 404, 196, 717
  ];
  placas         text[] := ARRAY['WGT','TKR','SNM','JHU','PLQ','BVC','XRD','MFT'];
BEGIN
  -- =====================================================================================
  -- Paso 1: 10 de los 15 departamentos vacíos reciben una bodega nueva con inventario.
  -- =====================================================================================
  SELECT array_agg(x) INTO objetivo FROM (SELECT unnest(candidatos) AS x ORDER BY random() LIMIT 10) t;

  FOREACH d IN ARRAY objetivo LOOP
    SELECT "Id" INTO mun FROM "Municipios" WHERE "DepartamentoId" = d ORDER BY random() LIMIT 1;
    SELECT "Id" INTO usuario_id FROM "Usuarios" WHERE "Rol" = 'Contribuyente' ORDER BY random() LIMIT 1;

    INSERT INTO "Bodegas" ("UsuarioId", "MunicipioId", "Nombre", "DireccionEspecifica", "UbicacionEspecifica")
    SELECT usuario_id, mun,
           nombres_bodega[1 + floor(random() * array_length(nombres_bodega, 1))::int] || ' ' || initcap(m."Nombre"),
           NULL, NULL
    FROM "Municipios" m WHERE m."Id" = mun
    RETURNING "Id" INTO bodega_id;

    bodegas_nuevas := array_append(bodegas_nuevas, bodega_id);

    INSERT INTO "InventarioProductos" ("BodegaId", "ProductoId", "CantidadDisponible")
    SELECT bodega_id, p."Id", (500 + floor(random() * 9500))::numeric
    FROM (SELECT "Id" FROM "Productos" ORDER BY random() LIMIT 8) p;

    INSERT INTO "EntradasInventario" ("BodegaId", "ProductoId", "Cantidad", "Fecha")
    SELECT ip."BodegaId", ip."ProductoId", ip."CantidadDisponible",
           timestamptz '2022-11-15 15:00:00+00' + (floor(random() * 60) || ' days')::interval
    FROM "InventarioProductos" ip WHERE ip."BodegaId" = bodega_id;
  END LOOP;

  -- =====================================================================================
  -- Paso 2: 20 tornaguías, cada una originada en una de esas bodegas nuevas al azar.
  -- =====================================================================================
  FOR n IN 1..20 LOOP

    bodega_id := bodegas_nuevas[1 + floor(random() * array_length(bodegas_nuevas, 1))::int];

    SELECT bo."UsuarioId", bo."MunicipioId", m."DepartamentoId", m."Nombre", us."Nombre"
      INTO usuario_id, b_municipio_id, b_departamento_id, nombre_origen, u_nombre
    FROM "Bodegas" bo
    JOIN "Municipios" m ON m."Id" = bo."MunicipioId"
    JOIN "Usuarios" us ON us."Id" = bo."UsuarioId"
    WHERE bo."Id" = bodega_id;

    depto_origen := b_departamento_id;

    -- ---- destino (mismo catálogo de ciudades conocidas que los otros seeds) ----------
    es_exportacion := random() < 0.10;
    pais_id        := NULL;
    mun_destino    := NULL;

    IF es_exportacion THEN
      pais_id := 1 + floor(random() * 5)::int;
      SELECT "Nombre" INTO nombre_destino FROM "Paises" WHERE "Id" = pais_id;
      depto_destino := NULL;
      mismo_depto   := false;
    ELSE
      IF random() < 0.22 THEN
        SELECT "Id" INTO mun_destino FROM "Municipios"
        WHERE "DepartamentoId" = depto_origen AND "Id" <> b_municipio_id
        ORDER BY random() LIMIT 1;
      END IF;

      IF mun_destino IS NULL THEN
        SELECT c INTO mun_destino FROM unnest(ciudades) AS c
        WHERE c <> b_municipio_id
          AND (SELECT "DepartamentoId" FROM "Municipios" WHERE "Id" = c) <> depto_origen
        ORDER BY random() LIMIT 1;
      END IF;

      SELECT "DepartamentoId", "Nombre" INTO depto_destino, nombre_destino
      FROM "Municipios" WHERE "Id" = mun_destino;

      mismo_depto := (depto_destino = depto_origen);
    END IF;

    esta_declarado := random() < 0.36;

    IF es_exportacion THEN
      tipo_id := 3;
      justif  := 'El traslado tiene como propósito la exportación.';
    ELSIF mismo_depto THEN
      tipo_id := 3;
      justif  := 'El origen y el destino se encuentran dentro del mismo departamento.';
    ELSIF esta_declarado THEN
      tipo_id := 2;
      justif  := 'El origen y el destino están en departamentos distintos, y el producto ya fue declarado en el departamento de origen.';
    ELSE
      tipo_id := 1;
      justif  := 'El origen y el destino están en departamentos distintos, y el producto no está declarado.';
    END IF;

    justif := justif || ' (Origen: ' || nombre_origen || ', Destino: ' || nombre_destino || ')';

    anio := (ARRAY[2023,2023,2024,2024,2024,2025,2025,2025,2025,2026,2026,2026,2026])
            [1 + floor(random() * 13)::int];
    mes  := (ARRAY[1,2,3,4,5,6,7,8,9,10,11,11,12,12,12])
            [1 + floor(random() * 15)::int];
    IF anio = 2026 AND mes > 9 THEN mes := 1 + floor(random() * 9)::int; END IF;
    dia   := 1 + floor(random() * 27)::int;
    fecha := make_timestamptz(anio, mes, dia, 15, 0, 0, 'UTC');

    SELECT rc."DistanciaKm", rc."TiempoEstimadoMinutos", rc."EsAproximada", rc."DepartamentosIntermedios"
      INTO r
    FROM "RutasCalculadas" rc
    WHERE rc."MunicipioOrigenId" = b_municipio_id
      AND (  (mun_destino IS NOT NULL AND rc."MunicipioDestinoId" = mun_destino)
          OR (pais_id     IS NOT NULL AND rc."PaisDestinoId"      = pais_id) )
    LIMIT 1;

    ruta_cacheada := FOUND;

    IF ruta_cacheada THEN
      via_km  := r."DistanciaKm";
      minutos := r."TiempoEstimadoMinutos";
      aprox   := r."EsAproximada";
      SELECT array_agg(d2."Nombre" ORDER BY orden)
        INTO deptos
      FROM json_array_elements_text(r."DepartamentosIntermedios"::json) WITH ORDINALITY AS t(id_txt, orden)
      JOIN "Departamentos" d2 ON d2."Id" = t.id_txt::int;

    ELSIF mun_destino IS NOT NULL THEN
      SELECT ST_Distance(mo."Ubicacion"::geography, md."Ubicacion"::geography) / 1000
        INTO recta_km
      FROM "Municipios" mo, "Municipios" md
      WHERE mo."Id" = b_municipio_id AND md."Id" = mun_destino;

      factor := CASE
                  WHEN recta_km <  50 THEN 2.00
                  WHEN recta_km < 150 THEN 1.65
                  WHEN recta_km < 350 THEN 1.55
                  ELSE                     1.48
                END * (0.92 + random() * 0.16);
      via_km := round((recta_km * factor)::numeric, 2);

      kmh := CASE
               WHEN via_km <  80 THEN 20 + random() * 10
               WHEN via_km < 200 THEN 32 + random() *  8
               WHEN via_km < 450 THEN 40 + random() *  8
               ELSE                   46 + random() *  7
             END;
      minutos := greatest(15, round(via_km / kmh * 60)::int);
      aprox   := false;

      SELECT array_agg(d2."Nombre" ORDER BY ST_LineLocatePoint(linea, ST_Centroid(d2."Limites")))
        INTO deptos
      FROM (
        SELECT ST_MakeLine(mo."Ubicacion", md."Ubicacion") AS linea
        FROM "Municipios" mo, "Municipios" md
        WHERE mo."Id" = b_municipio_id AND md."Id" = mun_destino
      ) l
      JOIN "Departamentos" d2
        ON d2."Limites" IS NOT NULL
       AND ST_Intersects(d2."Limites", l.linea)
       AND d2."Id" NOT IN (depto_origen, depto_destino);

    ELSE
      via_km  := NULL;
      minutos := NULL;
      aprox   := false;
      deptos  := NULL;
    END IF;

    decl_id     := NULL;
    decl_numero := NULL;
    IF esta_declarado THEN
      SELECT dd."Id", dd."NumeroDeclaracion" INTO decl_id, decl_numero
      FROM "DeclaracionesDepartamentales" dd
      WHERE dd."DepartamentoId" = depto_origen
        AND dd."FechaCarga" < fecha
        AND NOT EXISTS (SELECT 1 FROM "Lotes" l WHERE l."DeclaracionDepartamentalId" = dd."Id")
      ORDER BY random() LIMIT 1;
    END IF;

    INSERT INTO "Lotes" ("BodegaId", "Estado", "FechaCreacion", "DeclaracionDepartamentalId")
    VALUES (bodega_id, 1, fecha - interval '3 days', decl_id)
    RETURNING "Id" INTO lote_id;

    INSERT INTO "LotesProductos" ("LoteId", "ProductoId", "Cantidad", "ValorImpuestoConsumo")
    SELECT lote_id, ip."ProductoId", cant.c, cant.c * 1300
    FROM (
      SELECT "ProductoId" FROM "InventarioProductos"
      WHERE "BodegaId" = bodega_id ORDER BY random() LIMIT (1 + floor(random() * 4))::int
    ) ip
    CROSS JOIN LATERAL (SELECT (50 + floor(random() * 1450))::numeric AS c) cant;

    INSERT INTO "Solicitudes" (
      "TipoTornaguiaId", "UsuarioId", "MunicipioOrigenId", "MunicipioDestinoId",
      "BodegaOrigenId", "BodegaDestinoId", "PaisDestinoId", "EstaDeclarado",
      "EsParaExportacion", "NumeroDeclaracionOrigen", "Justificacion", "DistanciaKm",
      "TiempoEstimadoMinutos", "DepartamentosIntermedios", "EsAproximada", "FechaSolicitud", "LoteId")
    VALUES (
      tipo_id, usuario_id, b_municipio_id, mun_destino,
      bodega_id, NULL, pais_id, esta_declarado,
      es_exportacion, decl_numero, justif, via_km,
      minutos, COALESCE(deptos, ARRAY[]::text[]), aprox, fecha, lote_id)
    RETURNING "Id" INTO solicitud_id;

    INSERT INTO "SolicitudesProductos" ("SolicitudId", "ProductoId", "Cantidad", "ValorImpuestoConsumo")
    SELECT solicitud_id, lp."ProductoId", lp."Cantidad", lp."ValorImpuestoConsumo"
    FROM "LotesProductos" lp WHERE lp."LoteId" = lote_id;

    IF random() < 0.55 THEN
      INSERT INTO "SolicitudesDetalleTornaguia" (
        "SolicitudId", "RemitenteNombre", "RemitenteIdentificacion",
        "DestinatarioNombre", "DestinatarioIdentificacion",
        "TransportadorNombre", "TransportadorIdentificacion", "PlacaVehiculo",
        "FechaGeneracion", "PdfBytes")
      VALUES (
        solicitud_id,
        u_nombre,
        '9' || lpad((floor(random() * 99999999))::text, 8, '0') || '-' || floor(random() * 10)::text,
        initcap(nombre_destino) || ' Comercial S.A.S.',
        '9' || lpad((floor(random() * 99999999))::text, 8, '0') || '-' || floor(random() * 10)::text,
        'Transportes ' || initcap(nombre_origen) || ' Ltda.',
        '8' || lpad((floor(random() * 99999999))::text, 8, '0') || '-' || floor(random() * 10)::text,
        placas[1 + floor(random() * array_length(placas, 1))::int] || lpad((floor(random() * 1000))::text, 3, '0'),
        fecha + interval '4 hours',
        NULL);
    END IF;

  END LOOP;

  RAISE NOTICE 'Departamentos con bodega/tornaguía nueva: %', objetivo;
  RAISE NOTICE 'Departamentos dejados vacíos a propósito: %', (SELECT array_agg(x) FROM unnest(candidatos) x WHERE x <> ALL(objetivo));
END $$;

COMMIT;
