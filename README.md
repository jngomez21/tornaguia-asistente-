# 🚚 TornaGuía Asistente

Asistente que determina el tipo de tornaguía (certificado tributario de
transporte en Colombia) según origen, destino y estado de declaración de
mercancías con impuesto al consumo (licores, cigarrillos, cervezas).


## 🧰 Stack tecnológico

**Backend**

![.NET 10](https://img.shields.io/badge/.NET-10-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![EF Core](https://img.shields.io/badge/EF%20Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![BCrypt](https://img.shields.io/badge/BCrypt-4B4B4B?style=for-the-badge)

**Frontend**

![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS%20v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack%20Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)

**Infraestructura**

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![PostGIS](https://img.shields.io/badge/PostGIS-008000?style=for-the-badge&logo=postgresql&logoColor=white)
![Podman](https://img.shields.io/badge/Podman-892CA0?style=for-the-badge&logo=podman&logoColor=white)
![Mapbox](https://img.shields.io/badge/Mapbox-000000?style=for-the-badge&logo=mapbox&logoColor=white)

## ⚖️ Motor de reglas

Solo existen 3 tipos legales de tornaguía (Decreto 1625/2016, art. 2.2.1.3.3).
El motor los determina a partir de 3 variables booleanas: si el traslado es
para exportación, si origen y destino están en el mismo departamento, y si el
producto ya fue declarado (causó el impuesto):

- 📦 **Movilización** — traslado interdepartamental de un producto que
  **aún no** ha causado el impuesto al consumo en el origen.
- 🔁 **Reenvío** — traslado interdepartamental de un producto que **ya fue
  declarado/causado** en el departamento de origen.
- 🛣️ **Tránsito** — traslado dentro de la misma entidad territorial (aunque la
  ruta física cruce otro departamento de paso), o con destino a exportación /
  otro país.

El árbol de decisión vive completo en `Domain`, sin dependencias externas
(`IMotorReglas`). Detalle normativo: [`docs/negocio/tornaguias-analisis-normativo.md`](docs/negocio/tornaguias-analisis-normativo.md).
Diagrama: [`docs/diagramas/arbol-decision-motor-reglas.svg`](docs/diagramas/arbol-decision-motor-reglas.svg).

## 🧭 Funcionamiento

Flujo típico de una solicitud de envío, de principio a fin:

1. 🔐 **Inicio de sesión** — el usuario se autentica (JWT).
2. 🏭 **Selecciona la bodega de origen** — con su inventario de lotes y productos disponibles.
3. 🔎 **Busca destino y producto** — municipio/país de destino y producto a movilizar.
4. ✅ **Indica el estado de declaración** — si el producto ya causó el impuesto al consumo.
5. 🗺️ **El backend calcula la ruta** — vía Mapbox/PostGIS, determinando si origen y destino
   comparten departamento y qué departamentos intermedios atraviesa.
6. ⚖️ **El motor de reglas resuelve el tipo de tornaguía** — Movilización, Reenvío o
   Tránsito, con la explicación del porqué (`ExplicacionTipoTornaguia`).
7. 📄 **Se genera y guarda el PDF de la tornaguía** — con el detalle de la solicitud y el
   resultado, consultable después desde el historial.

## 🧱 Arquitectura

Clean Architecture con separación estricta de capas:

- `Domain` — entidades y motor de reglas (`IMotorReglas`). No referencia
  otros proyectos (única excepción: `NetTopologySuite`, ver ADR-0003).
- `Application` — casos de uso y definición de interfaces (p. ej.
  `IMotorGeografico`).
- `Infrastructure` — implementaciones (Mapbox/PostGIS para geografía, con
  caché vía Decorator `MotorGeograficoConCache`; persistencia con EF Core).
- `Api` — controllers y configuración de la aplicación.

`Application` nunca depende de `Infrastructure`.

## 📁 Estructura del repositorio

```
backend/
  src/
    TornaguiaAsistente.Domain/          # Entidades, motor de reglas
    TornaguiaAsistente.Application/     # Casos de uso, interfaces
    TornaguiaAsistente.Infrastructure/  # EF Core, Mapbox, PostGIS
    TornaguiaAsistente.Api/             # Controllers, Program.cs
  tests/
  tools/                                # Utilidades de seed (datos geográficos)
frontend/
  src/
    features/                           # auth, bodegas, inicio, inventario, solicitudes
    shared/                             # componentes, lib y tipos compartidos
database/
  seed/                                 # catálogos base (tipos de tornaguía, productos)
docs/
  negocio/                              # análisis normativo del dominio
  adr/                                  # decisiones de arquitectura
  diagramas/                            # arquitectura, modelo de datos, árbol de decisión
  checklist-setup.md                    # guía paso a paso para levantar el proyecto
```

## 🚀 Puesta en marcha

Requiere .NET 10 SDK, Node.js, Podman y `podman-compose`.

```bash
git clone <url-del-repo>
cd tornaguia-asistente

# Secretos locales (no viajan con Git)
cd backend/src/TornaguiaAsistente.Api
dotnet user-secrets init
dotnet user-secrets set "Mapbox:AccessToken" "TU_TOKEN_DE_MAPBOX"
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5433;Database=tornaguia_db;Username=tornaguia_user;Password=tornaguia_pass"
cd ../../..

# Base de datos
podman-compose up -d
cd backend && dotnet ef database update --project src/TornaguiaAsistente.Infrastructure --startup-project src/TornaguiaAsistente.Api && cd ..

# API
dotnet run --project backend/src/TornaguiaAsistente.Api
```

📋 Guía completa con verificaciones en cada paso (extensión PostGIS, seed de
departamentos/municipios, catálogos, tests):
[`docs/checklist-setup.md`](docs/checklist-setup.md).

## 📚 Documentación adicional

- [`docs/negocio/`](docs/negocio) — análisis normativo del dominio de tornaguías.
- [`docs/adr/`](docs/adr) — decisiones de arquitectura (NetTopologySuite en
  Domain, fuente del GeoJSON de departamentos, configuración de JWT/Swashbuckle).
- [`docs/diagramas/`](docs/diagramas) — arquitectura, modelo de datos y árbol
  de decisión del motor de reglas.

## ✅ Estado del proyecto

En desarrollo. Implementado hasta ahora:

- 🔐 Autenticación (registro, login, recuperación de contraseña) con JWT + BCrypt.
- 🏭 Gestión de bodegas y visualización de lotes/inventario.
- ⚖️ Motor de reglas para los tres tipos de tornaguía.
- 🗺️ Cálculo de rutas geográficas (Mapbox/PostGIS) integrado al flujo de solicitudes.
- 📄 Flujo de solicitudes de envío (generar nuevo envío / retomar solicitud pendiente)
  con generación y almacenamiento del PDF de la tornaguía.
