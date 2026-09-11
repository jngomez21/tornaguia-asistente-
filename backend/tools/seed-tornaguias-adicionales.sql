-- =====================================================================================
-- 238 tornaguías adicionales para TornaGuía Asistente
--
-- Mismo generador que la sección 6 de seed-datos-demo.sql (motor de reglas, caché de rutas +
-- fallback PostGIS, fechas 2023-2026), pero sin crear contribuyentes/productos/bodegas nuevos:
-- cada una de las 238 tornaguías se asigna a un contribuyente elegido al azar entre los 32 ya
-- existentes, así que el reparto por contribuyente queda naturalmente desigual (no 238/32 fijo).
--
-- Decisiones que hay detrás (iguales a seed-datos-demo.sql, ver ahí el detalle):
--
--  * El tipo de tornaguía NO se sortea: se aplica el mismo árbol de MotorReglas.Determinar.
--  * El impuesto sale de ValorPorUnidadPorDefecto (1.300 por unidad).
--  * Las rutas ya cacheadas en "RutasCalculadas" se reutilizan; si el par no está cacheado se
--    calculan con PostGIS (distancia recta + factor de sinuosidad) y NO se escribe nada en
--    "RutasCalculadas" — esa caché debe contener solo lo que Mapbox calculó de verdad.
--  * Las fechas van a las 15:00 UTC = 10:00 Colombia, lejos del borde de mes.
--
-- Marca de agua antes de sembrar (para poder revertir con seed-tornaguias-adicionales-limpiar.sql):
--   Solicitudes <= 693, SolicitudesProductos <= 1653, SolicitudesDetalleTornaguia <= 370,
--   Lotes <= 724, LotesProductos <= 1770.
--
-- Ejecutar:  podman exec -i tornaguia-db psql -U tornaguia_user -d tornaguia_db < seed-tornaguias-adicionales.sql
-- Revertir:  seed-tornaguias-adicionales-limpiar.sql
-- =====================================================================================

\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  u              record;
  b              record;
  n              int;
  -- destino
  es_exportacion boolean;
  pais_id        int;
  mun_destino    int;
  depto_origen   int;
  depto_destino  int;
  mismo_depto    boolean;
  esta_declarado boolean;
  -- resultado de reglas
  tipo_id        int;
  justif         text;
  nombre_origen  text;
  nombre_destino text;
  -- fecha
  anio           int;
  mes            int;
  dia            int;
  fecha          timestamptz;
  -- ruta
  r              record;
  ruta_cacheada  boolean;
  recta_km       numeric;
  factor         numeric;
  via_km         numeric;
  kmh            numeric;
  minutos        int;
  aprox          boolean;
  deptos         text[];
  -- inserción
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
  FOR n IN 1..238 LOOP

    -- ---- contribuyente al azar (con reemplazo: el mismo puede salir varias veces) ----
    SELECT "Id", "Nombre" INTO u FROM "Usuarios"
    WHERE "Rol" = 'Contribuyente' ORDER BY random() LIMIT 1;

    -- ---- bodega de origen (siempre del propio contribuyente) ------------------------
    SELECT bo."Id" AS bodega_id, bo."MunicipioId" AS municipio_id,
           m."DepartamentoId" AS departamento_id, m."Nombre" AS municipio_nombre
      INTO b
    FROM "Bodegas" bo
    JOIN "Municipios" m ON m."Id" = bo."MunicipioId"
    WHERE bo."UsuarioId" = u."Id"
    ORDER BY random() LIMIT 1;

    CONTINUE WHEN NOT FOUND;

    depto_origen  := b.departamento_id;
    nombre_origen := b.municipio_nombre;

    -- ---- destino ---------------------------------------------------------------------
    -- 10% exportación (solo hacia los 5 países que ya tienen ruta real en caché),
    -- 20% mismo departamento, 70% otro departamento.
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
        WHERE "DepartamentoId" = depto_origen AND "Id" <> b.municipio_id
        ORDER BY random() LIMIT 1;
      END IF;

      IF mun_destino IS NULL THEN
        SELECT c INTO mun_destino FROM unnest(ciudades) AS c
        WHERE c <> b.municipio_id
          AND (SELECT "DepartamentoId" FROM "Municipios" WHERE "Id" = c) <> depto_origen
        ORDER BY random() LIMIT 1;
      END IF;

      SELECT "DepartamentoId", "Nombre" INTO depto_destino, nombre_destino
      FROM "Municipios" WHERE "Id" = mun_destino;

      mismo_depto := (depto_destino = depto_origen);
    END IF;

    esta_declarado := random() < 0.36;

    -- ---- árbol de MotorReglas.Determinar, en el mismo orden --------------------------
    IF es_exportacion THEN
      tipo_id := 3;  -- Tránsito
      justif  := 'El traslado tiene como propósito la exportación.';
    ELSIF mismo_depto THEN
      tipo_id := 3;  -- Tránsito
      justif  := 'El origen y el destino se encuentran dentro del mismo departamento.';
    ELSIF esta_declarado THEN
      tipo_id := 2;  -- Reenvío
      justif  := 'El origen y el destino están en departamentos distintos, y el producto ya fue declarado en el departamento de origen.';
    ELSE
      tipo_id := 1;  -- Movilización
      justif  := 'El origen y el destino están en departamentos distintos, y el producto no está declarado.';
    END IF;

    justif := justif || ' (Origen: ' || nombre_origen || ', Destino: ' || nombre_destino || ')';

    -- ---- fecha: 2023-2026, creciente, con pico en noviembre y diciembre --------------
    anio := (ARRAY[2023,2023,2024,2024,2024,2025,2025,2025,2025,2026,2026,2026,2026])
            [1 + floor(random() * 13)::int];
    mes  := (ARRAY[1,2,3,4,5,6,7,8,9,10,11,11,12,12,12])
            [1 + floor(random() * 15)::int];
    IF anio = 2026 AND mes > 9 THEN mes := 1 + floor(random() * 9)::int; END IF;
    dia   := 1 + floor(random() * 27)::int;
    fecha := make_timestamptz(anio, mes, dia, 15, 0, 0, 'UTC');

    -- ---- datos de ruta ----------------------------------------------------------------
    -- Primero la caché real de Mapbox; si el par no está, se calculan con PostGIS.
    -- En ningún caso se escribe en "RutasCalculadas".
    SELECT rc."DistanciaKm", rc."TiempoEstimadoMinutos", rc."EsAproximada", rc."DepartamentosIntermedios"
      INTO r
    FROM "RutasCalculadas" rc
    WHERE rc."MunicipioOrigenId" = b.municipio_id
      AND (  (mun_destino IS NOT NULL AND rc."MunicipioDestinoId" = mun_destino)
          OR (pais_id     IS NOT NULL AND rc."PaisDestinoId"      = pais_id) )
    LIMIT 1;

    ruta_cacheada := FOUND;

    IF ruta_cacheada THEN
      via_km  := r."DistanciaKm";
      minutos := r."TiempoEstimadoMinutos";
      aprox   := r."EsAproximada";
      SELECT array_agg(d."Nombre" ORDER BY orden)
        INTO deptos
      FROM json_array_elements_text(r."DepartamentosIntermedios"::json) WITH ORDINALITY AS t(id_txt, orden)
      JOIN "Departamentos" d ON d."Id" = t.id_txt::int;

    ELSIF mun_destino IS NOT NULL THEN
      SELECT ST_Distance(mo."Ubicacion"::geography, md."Ubicacion"::geography) / 1000
        INTO recta_km
      FROM "Municipios" mo, "Municipios" md
      WHERE mo."Id" = b.municipio_id AND md."Id" = mun_destino;

      -- Factor de sinuosidad calibrado contra las rutas reales ya cacheadas.
      factor := CASE
                  WHEN recta_km <  50 THEN 2.00
                  WHEN recta_km < 150 THEN 1.65
                  WHEN recta_km < 350 THEN 1.55
                  ELSE                     1.48
                END * (0.92 + random() * 0.16);
      via_km := round((recta_km * factor)::numeric, 2);

      -- La velocidad media sube con la distancia, igual que en los datos reales.
      kmh := CASE
               WHEN via_km <  80 THEN 20 + random() * 10
               WHEN via_km < 200 THEN 32 + random() *  8
               WHEN via_km < 450 THEN 40 + random() *  8
               ELSE                   46 + random() *  7
             END;
      minutos := greatest(15, round(via_km / kmh * 60)::int);
      aprox   := false;

      -- Departamentos que cruza la recta origen-destino, en orden de recorrido.
      SELECT array_agg(d."Nombre" ORDER BY ST_LineLocatePoint(linea, ST_Centroid(d."Limites")))
        INTO deptos
      FROM (
        SELECT ST_MakeLine(mo."Ubicacion", md."Ubicacion") AS linea
        FROM "Municipios" mo, "Municipios" md
        WHERE mo."Id" = b.municipio_id AND md."Id" = mun_destino
      ) l
      JOIN "Departamentos" d
        ON d."Limites" IS NOT NULL
       AND ST_Intersects(d."Limites", l.linea)
       AND d."Id" NOT IN (depto_origen, depto_destino);

    ELSE
      -- Exportación hacia un país sin ruta cacheada para esta bodega: se deja sin datos de
      -- ruta antes que inventar una travesía internacional.
      via_km  := NULL;
      minutos := NULL;
      aprox   := false;
      deptos  := NULL;
    END IF;

    -- ---- declaración de origen cuando la tornaguía va declarada ----------------------
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

    -- ---- lote vinculado ----------------------------------------------------------------
    INSERT INTO "Lotes" ("BodegaId", "Estado", "FechaCreacion", "DeclaracionDepartamentalId")
    VALUES (b.bodega_id, 1, fecha - interval '3 days', decl_id)
    RETURNING "Id" INTO lote_id;

    INSERT INTO "LotesProductos" ("LoteId", "ProductoId", "Cantidad", "ValorImpuestoConsumo")
    SELECT lote_id, ip."ProductoId", cant.c, cant.c * 1300
    FROM (
      SELECT "ProductoId" FROM "InventarioProductos"
      WHERE "BodegaId" = b.bodega_id ORDER BY random() LIMIT (1 + floor(random() * 4))::int
    ) ip
    CROSS JOIN LATERAL (SELECT (50 + floor(random() * 1450))::numeric AS c) cant;

    -- ---- tornaguía -----------------------------------------------------------------------
    INSERT INTO "Solicitudes" (
      "TipoTornaguiaId", "UsuarioId", "MunicipioOrigenId", "MunicipioDestinoId",
      "BodegaOrigenId", "BodegaDestinoId", "PaisDestinoId", "EstaDeclarado",
      "EsParaExportacion", "NumeroDeclaracionOrigen", "Justificacion", "DistanciaKm",
      "TiempoEstimadoMinutos", "DepartamentosIntermedios", "EsAproximada", "FechaSolicitud", "LoteId")
    VALUES (
      tipo_id, u."Id", b.municipio_id, mun_destino,
      b.bodega_id, NULL, pais_id, esta_declarado,
      es_exportacion, decl_numero, justif, via_km,
      minutos, COALESCE(deptos, ARRAY[]::text[]), aprox, fecha, lote_id)
    RETURNING "Id" INTO solicitud_id;

    -- ---- líneas congeladas de la tornaguía -----------------------------------------------
    INSERT INTO "SolicitudesProductos" ("SolicitudId", "ProductoId", "Cantidad", "ValorImpuestoConsumo")
    SELECT solicitud_id, lp."ProductoId", lp."Cantidad", lp."ValorImpuestoConsumo"
    FROM "LotesProductos" lp WHERE lp."LoteId" = lote_id;

    -- ---- detalle de transporte (en el 55% de los casos) ----------------------------------
    IF random() < 0.55 THEN
      INSERT INTO "SolicitudesDetalleTornaguia" (
        "SolicitudId", "RemitenteNombre", "RemitenteIdentificacion",
        "DestinatarioNombre", "DestinatarioIdentificacion",
        "TransportadorNombre", "TransportadorIdentificacion", "PlacaVehiculo",
        "FechaGeneracion", "PdfBytes")
      VALUES (
        solicitud_id,
        u."Nombre",
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
END $$;

COMMIT;
