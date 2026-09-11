-- =====================================================================================
-- Datos de demostración para TornaGuía Asistente
--
-- Genera 20 contribuyentes nuevos, 24 productos (hasta llegar a 50), bodegas, inventario,
-- declaraciones departamentales, lotes y 20 tornaguías por cada contribuyente (los 12 que ya
-- existían más los 20 nuevos = 640 solicitudes) repartidas entre 2023 y 2026.
--
-- Decisiones que hay detrás:
--
--  * El tipo de tornaguía NO se sortea: se aplica el mismo árbol de MotorReglas.Determinar
--    (exportación → Tránsito; mismo departamento → Tránsito; declarado → Reenvío; resto →
--    Movilización), con la justificación en el formato exacto que arma CasoUsoCrearSolicitud.
--
--  * El impuesto sale de ImpuestoConsumo.ValorPorUnidadPorDefecto (1.300 por unidad), no de
--    valores inventados. Recuerda que "causado" son las tornaguías de Reenvío y "por causar"
--    las de Movilización y Tránsito (ver ImpuestoConsumoQueries), así que la mezcla de tipos
--    es lo que define esos dos KPIs.
--
--  * Las rutas ya cacheadas en "RutasCalculadas" se reutilizan tal cual (distancia, tiempo,
--    EsAproximada y departamentos reales de Mapbox). Para los pares que no estén cacheados se
--    calculan valores coherentes con PostGIS —distancia en línea recta por un factor de
--    sinuosidad, y departamentos que cruza la recta— y NO se escribe nada en "RutasCalculadas":
--    la caché debe contener solo lo que Mapbox calculó de verdad.
--
--    El factor de sinuosidad y la velocidad están calibrados contra las 13 rutas reales que ya
--    había en caché: el factor va de ~1,85 en trayectos cortos a ~1,48 en largos, y la velocidad
--    sube con la distancia (15 km/h a 20 km, ~44 a 250 km, ~52 a 650 km).
--
--  * Las fechas se fijan explícitamente (la app siempre usa DateTime.UtcNow) a las 15:00 UTC =
--    10:00 en Colombia. Lejos del borde de mes a propósito: CasoUsoObtenerSerieMensual agrupa en
--    hora local, así que una fecha a las 02:00 UTC del día 1 caería en el mes anterior.
--
-- Ejecutar:  podman exec -i tornaguia-db psql -U tornaguia_user -d tornaguia_db < seed-datos-demo.sql
-- Revertir:  seed-datos-demo-limpiar.sql
-- =====================================================================================

\set ON_ERROR_STOP on

BEGIN;

-- =====================================================================================
-- 1. Productos (24 nuevos → 50 en total)
-- =====================================================================================
INSERT INTO "Productos" ("Nombre", "CodigoUnico", "EsNacional", "Capacidad") VALUES
  ('Aguardiente Blanco del Valle',       'AGUARDIENTE_BLANCO_DEL_VALLE',    true,  750),
  ('Aguardiente Amarillo de Manzanares', 'AGUARDIENTE_AMARILLO_MANZANARES', true,  750),
  ('Aguardiente Llanero',                'AGUARDIENTE_LLANERO',             true,  750),
  ('Aguardiente Tapa Roja',              'AGUARDIENTE_TAPA_ROJA',           true,  750),
  ('Ron Santafé',                        'RON_SANTAFE',                     true,  750),
  ('Ron Caldas Tradicional',             'RON_CALDAS_TRADICIONAL',          true,  750),
  ('Ron La Hechicera',                   'RON_LA_HECHICERA',                true,  750),
  ('Cerveza Andina',                     'CERVEZA_ANDINA',                  true,  330),
  ('Cerveza Redd''s',                    'CERVEZA_REDDS',                   true,  330),
  ('Cerveza BBC Cajicá',                 'CERVEZA_BBC_CAJICA',              true,  330),
  ('Cerveza Corona Extra',               'CERVEZA_CORONA_EXTRA',            false, 355),
  ('Cerveza Heineken',                   'CERVEZA_HEINEKEN',                false, 330),
  ('Cerveza Stella Artois',              'CERVEZA_STELLA_ARTOIS',           false, 330),
  ('Whisky Johnnie Walker Red Label',    'WHISKY_JOHNNIE_WALKER_RED',       false, 750),
  ('Whisky Something Special',           'WHISKY_SOMETHING_SPECIAL',        false, 750),
  ('Whisky Chivas Regal 12',             'WHISKY_CHIVAS_REGAL_12',          false, 750),
  ('Vodka Smirnoff',                     'VODKA_SMIRNOFF',                  false, 750),
  ('Vodka Absolut',                      'VODKA_ABSOLUT',                   false, 750),
  ('Tequila José Cuervo Especial',       'TEQUILA_JOSE_CUERVO_ESPECIAL',    false, 750),
  ('Vino Gato Negro',                    'VINO_GATO_NEGRO',                 false, 750),
  ('Vino Undurraga',                     'VINO_UNDURRAGA',                  false, 750),
  ('Cigarrillos Lucky Strike',           'CIGARRILLOS_LUCKY_STRIKE',        false,  20),
  ('Cigarrillos Kool',                   'CIGARRILLOS_KOOL',                false,  20),
  ('Cigarrillos Green',                  'CIGARRILLOS_GREEN',               true,   20);

-- =====================================================================================
-- 2. Contribuyentes (20 nuevos)
--
-- Cuentas solo de datos: el hash no corresponde a ninguna contraseña, así que no se puede
-- iniciar sesión con ellas. Nombres de distribuidoras ficticias a propósito — son registros
-- tributarios inventados y no deben atribuirse a empresas reales.
-- =====================================================================================
INSERT INTO "Usuarios" ("Nombre", "Email", "PasswordHash", "PreguntaSeguridad", "RespuestaSeguridadHash", "Rol")
SELECT
  nombre,
  slug || '@demo.tornaguia.local',
  '$2a$11$K2CtDP7zSGOKgjXjxD8eYe.Uy9c5Mp9LTUZ9VZvKXFqXUZq0iOZKq',
  '¿En qué ciudad se constituyó la empresa?',
  '$2a$11$K2CtDP7zSGOKgjXjxD8eYe.Uy9c5Mp9LTUZ9VZvKXFqXUZq0iOZKq',
  'Contribuyente'
FROM (VALUES
  ('Distribuidora del Pacífico S.A.S.',   'pacifico'),
  ('Distribuidora Bahía Azul S.A.S.',     'bahiaazul'),
  ('Distribuidora El Peñón Ltda.',        'elpenon'),
  ('Distribuidora Cumbre Verde S.A.S.',   'cumbreverde'),
  ('Distribuidora La Esmeralda S.A.S.',   'laesmeralda'),
  ('Distribuidora Puerto Alegre Ltda.',   'puertoalegre'),
  ('Distribuidora San Cayetano S.A.S.',   'sancayetano'),
  ('Distribuidora Altamira S.A.S.',       'altamira'),
  ('Distribuidora El Tambo Ltda.',        'eltambo'),
  ('Distribuidora Río Claro S.A.S.',      'rioclaro'),
  ('Distribuidora Los Nogales S.A.S.',    'losnogales'),
  ('Distribuidora Villa del Sol Ltda.',   'villadelsol'),
  ('Distribuidora Campo Hermoso S.A.S.',  'campohermoso'),
  ('Distribuidora La Macarena S.A.S.',    'lamacarena'),
  ('Distribuidora El Recreo Ltda.',       'elrecreo'),
  ('Distribuidora Buenavista S.A.S.',     'buenavista'),
  ('Distribuidora Santa Elena S.A.S.',    'santaelena'),
  ('Distribuidora Palma Real Ltda.',      'palmareal'),
  ('Distribuidora Los Cerezos S.A.S.',    'loscerezos'),
  ('Distribuidora Monteverde S.A.S.',     'monteverde')
) AS n(nombre, slug);

-- =====================================================================================
-- 3. Bodegas
--
-- 1 a 3 por contribuyente nuevo, y al menos una para los 7 contribuyentes ya existentes que no
-- tenían ninguna (sin bodega no pueden tener lotes, y sin lote no hay tornaguía).
-- Las ciudades van ponderadas hacia Antioquia, Bogotá y Valle para que el mapa coroplético
-- tenga contraste en vez de salir todo del mismo tono.
-- UbicacionEspecifica queda nula: es opcional y llenarla exigiría geocodificar con Mapbox.
-- =====================================================================================
DO $$
DECLARE
  ciudades int[] := ARRAY[
    1,1,1,             -- MEDELLÍN
    149,149,149,       -- BOGOTÁ, D.C.
    1007,1007,         -- SANTIAGO DE CALI
    126, 150, 847, 833, 319, 960, 781, 688, 658,
    47, 59, 19, 1033, 821, 606, 362, 429, 934, 404, 196, 717
  ];
  nombres_bodega text[] := ARRAY[
    'Bodega Central', 'Bodega Norte', 'Bodega Sur', 'Centro de Distribución',
    'Bodega Principal', 'Almacén Industrial', 'Bodega La Playa', 'Bodega El Portal'
  ];
  u record;
  cuantas int;
  i int;
  mun int;
BEGIN
  FOR u IN
    SELECT "Id" FROM "Usuarios"
    WHERE "Rol" = 'Contribuyente'
      AND ("Id" > 26 OR NOT EXISTS (SELECT 1 FROM "Bodegas" b WHERE b."UsuarioId" = "Usuarios"."Id"))
    ORDER BY "Id"
  LOOP
    cuantas := 1 + floor(random() * 3)::int;   -- 1..3
    FOR i IN 1..cuantas LOOP
      mun := ciudades[1 + floor(random() * array_length(ciudades, 1))::int];
      INSERT INTO "Bodegas" ("UsuarioId", "MunicipioId", "Nombre", "DireccionEspecifica", "UbicacionEspecifica")
      SELECT
        u."Id",
        mun,
        nombres_bodega[1 + floor(random() * array_length(nombres_bodega, 1))::int] || ' ' || initcap(m."Nombre"),
        NULL,
        NULL
      FROM "Municipios" m WHERE m."Id" = mun;
    END LOOP;
  END LOOP;
END $$;

-- =====================================================================================
-- 4. Inventario por bodega
--
-- Se completa CADA bodega hasta 8 productos distintos, incluidas las que ya existían: algunas
-- tenían un solo producto y dos no tenían ninguno, y sin inventario sus lotes saldrían vacíos.
-- Solo se insertan productos que la bodega no tenga ya: no hay índice único en
-- (BodegaId, ProductoId), así que la unicidad hay que garantizarla aquí.
-- La fecha de entrada es anterior a cualquier tornaguía (todas caen a partir de 2023).
-- =====================================================================================
INSERT INTO "InventarioProductos" ("BodegaId", "ProductoId", "CantidadDisponible")
SELECT b."Id", p."Id", (500 + floor(random() * 9500))::numeric
FROM "Bodegas" b
CROSS JOIN LATERAL (
  SELECT pr."Id"
  FROM "Productos" pr
  WHERE NOT EXISTS (
    SELECT 1 FROM "InventarioProductos" ip
    WHERE ip."BodegaId" = b."Id" AND ip."ProductoId" = pr."Id"
  )
  ORDER BY random()
  LIMIT greatest(0, 8 - (SELECT count(*) FROM "InventarioProductos" ip2 WHERE ip2."BodegaId" = b."Id"))
) p;

INSERT INTO "EntradasInventario" ("BodegaId", "ProductoId", "Cantidad", "Fecha")
SELECT ip."BodegaId", ip."ProductoId", ip."CantidadDisponible",
       timestamptz '2022-11-15 15:00:00+00' + (floor(random() * 60) || ' days')::interval
FROM "InventarioProductos" ip
WHERE ip."Id" > 27;

-- =====================================================================================
-- 5. Declaraciones departamentales
--
-- 40 declaraciones repartidas por departamento y período. Todas comparten el mismo PDF mínimo:
-- sembrar 40 documentos distintos infla la base sin aportar nada a las métricas.
-- =====================================================================================
INSERT INTO "DeclaracionesDepartamentales"
  ("NumeroDeclaracion", "DepartamentoId", "Periodo", "RemitenteNombre", "RemitenteIdentificacion",
   "DocumentoBytes", "DocumentoNombreArchivo", "DocumentoContentType", "FechaCarga")
SELECT
  'DEMO-DD-' || anio || '-' || lpad(n::text, 4, '0'),
  d."Id",
  anio || '-' || lpad(mes::text, 2, '0'),
  u."Nombre",
  '9' || lpad((floor(random() * 99999999))::text, 8, '0') || '-' || floor(random() * 10)::text,
  convert_to(
    E'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n'
    || E'2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n'
    || E'3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n'
    || E'trailer<</Root 1 0 R>>\n%%EOF\n', 'LATIN1'),
  'declaracion-demo.pdf',
  'application/pdf',
  make_timestamptz(anio, mes, 12, 15, 0, 0, 'UTC')
FROM generate_series(1, 40) AS n
CROSS JOIN LATERAL (SELECT 2023 + floor(random() * 4)::int AS anio) a
CROSS JOIN LATERAL (SELECT 1 + floor(random() * 12)::int AS mes) m
CROSS JOIN LATERAL (SELECT "Id" FROM "Departamentos" ORDER BY random() LIMIT 1) d
CROSS JOIN LATERAL (SELECT "Nombre" FROM "Usuarios" WHERE "Rol" = 'Contribuyente' ORDER BY random() LIMIT 1) u
WHERE NOT (anio = 2026 AND mes > 9);   -- hoy es septiembre de 2026: no se siembran declaraciones futuras

-- =====================================================================================
-- 6. Lotes, tornaguías, líneas de producto y detalle de transporte
--
-- 20 tornaguías por contribuyente. Cada una nace de un lote Vinculado en una bodega suya, y las
-- líneas del lote se copian congeladas a SolicitudProducto (el snapshot que describe la entidad).
-- =====================================================================================
DO $$
DECLARE
  u              record;
  b              record;
  i              int;
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
  FOR u IN SELECT "Id", "Nombre" FROM "Usuarios" WHERE "Rol" = 'Contribuyente' ORDER BY "Id" LOOP
    FOR i IN 1..20 LOOP

      -- ---- bodega de origen (siempre del propio contribuyente) ----------------------
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

      -- ---- destino -----------------------------------------------------------------
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

      -- ---- árbol de MotorReglas.Determinar, en el mismo orden ----------------------
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

      -- ---- fecha: 2023-2026, creciente, con pico en noviembre y diciembre ----------
      anio := (ARRAY[2023,2023,2024,2024,2024,2025,2025,2025,2025,2026,2026,2026,2026])
              [1 + floor(random() * 13)::int];
      mes  := (ARRAY[1,2,3,4,5,6,7,8,9,10,11,11,12,12,12])
              [1 + floor(random() * 15)::int];
      IF anio = 2026 AND mes > 9 THEN mes := 1 + floor(random() * 9)::int; END IF;
      dia   := 1 + floor(random() * 27)::int;
      fecha := make_timestamptz(anio, mes, dia, 15, 0, 0, 'UTC');

      -- ---- datos de ruta ----------------------------------------------------------
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

      -- ---- declaración de origen cuando la tornaguía va declarada -------------------
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

      -- ---- lote vinculado ----------------------------------------------------------
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

      -- ---- tornaguía ---------------------------------------------------------------
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

      -- ---- líneas congeladas de la tornaguía ---------------------------------------
      INSERT INTO "SolicitudesProductos" ("SolicitudId", "ProductoId", "Cantidad", "ValorImpuestoConsumo")
      SELECT solicitud_id, lp."ProductoId", lp."Cantidad", lp."ValorImpuestoConsumo"
      FROM "LotesProductos" lp WHERE lp."LoteId" = lote_id;

      -- ---- detalle de transporte (en el 55% de los casos) --------------------------
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
          NULL);   -- el PDF se genera bajo demanda; sembrarlo aquí solo infla la base
      END IF;

    END LOOP;
  END LOOP;
END $$;

-- =====================================================================================
-- 7. Lotes sin usar
--
-- Alimentan el KPI "Lotes reservados" y el impuesto de inventario todavía sin movilizar.
-- Solo cuentan los que están en estado Reservado (ver ImpuestoConsumoQueries.LotesSinUsar);
-- los Cancelado se siembran únicamente por realismo.
-- =====================================================================================
DO $$
DECLARE
  b       record;
  lote_id int;
  estado  int;
BEGIN
  FOR b IN SELECT "Id" FROM "Bodegas" ORDER BY random() LIMIT 120 LOOP
    estado := CASE WHEN random() < 0.80 THEN 0 ELSE 2 END;   -- 0 = Reservado, 2 = Cancelado

    INSERT INTO "Lotes" ("BodegaId", "Estado", "FechaCreacion", "DeclaracionDepartamentalId")
    VALUES (b."Id", estado,
            timestamptz '2026-01-15 15:00:00+00' + (floor(random() * 230) || ' days')::interval,
            NULL)
    RETURNING "Id" INTO lote_id;

    INSERT INTO "LotesProductos" ("LoteId", "ProductoId", "Cantidad", "ValorImpuestoConsumo")
    SELECT lote_id, ip."ProductoId", cant.c, cant.c * 1300
    FROM (
      SELECT "ProductoId" FROM "InventarioProductos"
      WHERE "BodegaId" = b."Id" ORDER BY random() LIMIT (1 + floor(random() * 3))::int
    ) ip
    CROSS JOIN LATERAL (SELECT (50 + floor(random() * 950))::numeric AS c) cant;
  END LOOP;
END $$;

COMMIT;
