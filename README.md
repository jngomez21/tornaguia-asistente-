# 🚚 TornaGuía Asistente

Asistente que determina el tipo de tornaguía (certificado tributario de
transporte en Colombia) según origen, destino y estado de declaración de
mercancías con impuesto al consumo (licores, cigarrillos, cervezas).

> 🎓 Proyecto académico de desarrollador único, en desarrollo activo.

<p>
  <img alt=".NET 10" src="https://img.shields.io/badge/.NET-10-512BD4?style=for-the-badge&logo=dotnet&logoColor=white">
  <img alt="EF Core" src="https://img.shields.io/badge/EF%20Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
  <img alt="PostGIS" src="https://img.shields.io/badge/PostGIS-008000?style=for-the-badge&logo=postgresql&logoColor=white">
  <img alt="Podman" src="https://img.shields.io/badge/Podman-892CA0?style=for-the-badge&logo=podman&logoColor=white">
</p>
<p>
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
  <img alt="Tailwind CSS v4" src="https://img.shields.io/badge/Tailwind%20CSS%20v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
  <img alt="TanStack Query" src="https://img.shields.io/badge/TanStack%20Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white">
</p>
<p>
  <img alt="Mapbox" src="https://img.shields.io/badge/Mapbox-000000?style=for-the-badge&logo=mapbox&logoColor=white">
  <img alt="JWT" src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white">
  <img alt="BCrypt" src="https://img.shields.io/badge/BCrypt-4B4B4B?style=for-the-badge">
</p>

## ⚖️ Motor de reglas

Dado el origen, el destino y si la mercancía ya fue declarada, el motor
determina cuál de los tres tipos de tornaguía aplica:

- 🏠 **Movilización** — traslado dentro del mismo departamento.
- 🔁 **Reenvío** — la mercancía ya cuenta con tornaguía y se reenvía a otro destino.
- 🛣️ **Tránsito** — traslado que solo atraviesa un departamento sin destino en él.

El árbol de decisión vive completo en `Domain`, sin dependencias externas
(`IMotorReglas`). Diagrama: [`docs/diagramas/arbol-decision-motor-reglas.svg`](docs/diagramas/arbol-decision-motor-reglas.svg).

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
