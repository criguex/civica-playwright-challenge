<p align="right"><a href="README.md">English</a> · <strong>Español</strong></p>

<div align="center">

# 🎬 Cívica — Reto de Automatización de Pruebas (IMDb)

**Framework de automatización de pruebas con [Playwright](https://playwright.dev/) + [TypeScript](https://www.typescriptlang.org/), estructurado con el patrón Page Object Model — con una capa de mocks determinista, chequeos de accesibilidad y un motor de escenarios mutantes que aprende de ejecuciones anteriores.**

[![CI](https://github.com/criguex/civica-playwright-challenge/actions/workflows/ci.yml/badge.svg)](https://github.com/criguex/civica-playwright-challenge/actions/workflows/ci.yml)
[![Playwright](https://img.shields.io/badge/Playwright-1.63-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📑 Tabla de contenido

- [Visión general](#-visión-general)
- [Tipos de prueba](#-tipos-de-prueba)
- [Trazabilidad de requisitos](#-trazabilidad-de-requisitos)
- [Puntos destacados](#-puntos-destacados)
- [Arquitectura](#-arquitectura)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Principios de diseño](#-principios-de-diseño)
- [Estrategia de locators — sin XPath/CSS](#-estrategia-de-locators--sin-xpathcss)
- [Escenarios de prueba](#-escenarios-de-prueba)
- [Escenarios mutantes — cobertura que aprende](#-escenarios-mutantes--cobertura-que-aprende)
- [Accesibilidad](#-accesibilidad)
- [POCs de auditoría — futuro servicio de seguridad](#-pocs-de-auditoría--futuro-servicio-de-seguridad)
- [¿Por qué una capa de mocks?](#-por-qué-una-capa-de-mocks)
- [Cómo empezar](#-cómo-empezar)
- [Scripts disponibles](#-scripts-disponibles)
- [Configuración](#-configuración)
- [Reportes y artefactos](#-reportes-y-artefactos)
- [Integración continua](#-integración-continua)
- [Crecer y migrar](#-crecer-y-migrar)
- [Stack técnico](#-stack-técnico)
- [Autor](#-autor)

---

## 🎯 Visión general

Este repositorio resuelve el reto técnico: **construir un framework de
automatización con Playwright + TypeScript, aplicar Page Object Model, evitar
locators XPath/CSS y automatizar dos flujos comunes de IMDb** — y va más allá con
cobertura data-driven, chequeos de accesibilidad y un motor de mutación que
aprende.

IMDb bloquea la automatización con un muro _"Let's confirm you are human"_ (ver
[¿Por qué una capa de mocks?](#-por-qué-una-capa-de-mocks)). Como un buen
framework debe mantenerse **verde y demostrable sin depender de un tercero**, la
suite corre en proyectos que comparten los **mismos Page Objects**:

| Proyecto          | Backend                                                 | Fiabilidad                                               | Cuándo                                          |
| ----------------- | ------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| **`mock`**        | Réplica de IMDb en proceso (interceptación de requests) | ✅ Determinista, offline, siempre verde                  | Por defecto · CI · demos                        |
| **`mutation`**    | Mock + escenarios mutantes generados                    | ✅ Determinista, aprende solo                            | Ampliar cobertura                               |
| **`audit`**       | POCs de servicio de auditoría (web/móvil/mutantes)      | ✅ Determinista, offline                                 | Preview de servicio — [docs](docs/AUDIT-POC.md) |
| **`api`**         | Backend mock en proceso (socket real)                   | ✅ Determinista, offline                                 | Pruebas API + contrato                          |
| **`performance`** | Mock + Navigation Timing API                            | ✅ Determinista, presupuestos holgados                   | Guardia de regresión                            |
| **`visual`**      | Mock + capturas con baseline Linux                      | ✅ Determinista en Linux (CI) — opt-in en otros sistemas | Guardia de regresión visual                     |
| **`e2e`**         | `imdb.com` real                                         | ⚠️ Best-effort — skip honesto ante el muro anti-bot      | Exploración opt-in                              |

> **76 pruebas — 74 pasan, 2 se saltan honestamente** (E2E real tras el muro anti-bot). Ver [Tipos de prueba](#-tipos-de-prueba) para el catálogo completo.

---

## 🗂️ Tipos de prueba

| Tipo                            | Qué valida                                                                        | Comando                    | Corre en CI                                                  |
| ------------------------------- | --------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------ |
| **UI (mock, POM)**              | Flujos TC1/TC2, catálogo data-driven, insensibilidad a mayúsculas, sin resultados | `npm run test:mock`        | ✅ Sí                                                        |
| **Accesibilidad**               | Violaciones `serious`/`critical` WCAG 2 A/AA (axe-core) en cada página mock       | `npm run test:a11y`        | ✅ Sí (parte de `mock`)                                      |
| **Smoke**                       | Subconjunto rápido `@smoke` — un happy path por caso obligatorio (TC1 + TC2)      | `npm run test:smoke`       | ➖ No por separado (cubierto por `mock`)                     |
| **Mutación (aprende)**          | Escenarios mutantes auto-verificables, priorizados con un ledger de aprendizaje   | `npm run test:mutation`    | ✅ Sí                                                        |
| **POCs de auditoría**           | Exposición web (PII/secretos/headers), análisis estático Android, kill rate       | `npm run test:audit`       | ✅ Sí — ver [AUDIT-POC.md](docs/AUDIT-POC.md)                |
| **API**                         | Códigos de estado, forma de la respuesta, headers contra un backend mock real     | `npm run test:api`         | ✅ Sí                                                        |
| **Contrato**                    | Esquemas de respuesta (zod) — un drift se reporta, nunca se adapta el test        | `npm run test:contract`    | ✅ Sí                                                        |
| **Presupuestos de rendimiento** | Navigation Timing (`domContentLoaded`/`load`) con umbrales holgados               | `npm run test:performance` | ✅ Sí                                                        |
| **Regresión visual**            | Diff de píxeles (`toHaveScreenshot`) vs. baselines Linux generadas con Docker     | `npm run test:visual`      | ✅ Sí — baselines solo Linux, ver nota abajo                 |
| **E2E (real)**                  | Mismos Page Objects contra `imdb.com` real; skip honesto ante el muro anti-bot    | `npm run test:e2e`         | ⚠️ Opt-in (incluido en `npm run test:all`, siempre se salta) |

**Determinismo de la regresión visual** — Playwright nombra las baselines por
sistema operativo (`*-linux.png` / `*-darwin.png` / `*-win32.png`), y solo los
archivos `*-linux.png` están commiteados, generados dentro del
[`Dockerfile`](Dockerfile) del repo (misma versión de Playwright/Chromium que
instala CI). Una baseline tomada en macOS/Windows nunca la recoge CI. Si esto
resulta flaky en el runner Ubuntu de CI, se puede quitar el paso "Run visual
regression suite" de [`ci.yml`](.github/workflows/ci.yml) y dejar
`npm run test:visual` como chequeo local/opt-in — ver
[docs/GROWTH.md](docs/GROWTH.md) y [docs/MIGRATION.md](docs/MIGRATION.md)
para la receta de generación de baselines con Docker.

---

## ✅ Trazabilidad de requisitos

| #   | Requisito                                               | Dónde vive                                                                                                                                                   |
| --- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Playwright + TypeScript                                 | [`package.json`](package.json), [`tsconfig.json`](tsconfig.json)                                                                                             |
| 2   | Page Object Model                                       | [`src/pages/`](src/pages)                                                                                                                                    |
| 3   | Config: navegador / reporter / base URL                 | [`playwright.config.ts`](playwright.config.ts)                                                                                                               |
| 4   | Sin XPath/CSS — usar `getByRole` / `getByTestId` / …    | cada Page Object (ver [estrategia](#-estrategia-de-locators--sin-xpathcss))                                                                                  |
| 5   | **TC1** — Buscar y validar película                     | [`tests/mock/searchMovie.mock.spec.ts`](tests/mock/searchMovie.mock.spec.ts) · [`tests/e2e/searchMovie.e2e.spec.ts`](tests/e2e/searchMovie.e2e.spec.ts)      |
| 6   | **TC2** — Navegar Top 250 (vía menú)                    | [`tests/mock/top250.mock.spec.ts`](tests/mock/top250.mock.spec.ts) · [`tests/e2e/top250.e2e.spec.ts`](tests/e2e/top250.e2e.spec.ts)                          |
| 7   | Mocks cuando nada está operativo                        | [`mocks/`](mocks)                                                                                                                                            |
| 8   | Buenas prácticas / camelCase / SOLID / escalable        | [principios de diseño](#-principios-de-diseño)                                                                                                               |
| ➕  | Pruebas data-driven + negativas, validaciones profundas | [`tests/mock/`](tests/mock)                                                                                                                                  |
| ➕  | Accesibilidad (axe-core)                                | [`tests/mock/accessibility.mock.spec.ts`](tests/mock/accessibility.mock.spec.ts)                                                                             |
| ➕  | Escenarios mutantes que aprenden                        | [`docs/MUTATION-TESTING.md`](docs/MUTATION-TESTING.md)                                                                                                       |
| ➕  | POCs de servicio de auditoría de seguridad              | [`docs/AUDIT-POC.md`](docs/AUDIT-POC.md)                                                                                                                     |
| ➕  | Pruebas de API                                          | [`tests/api/movies.api.spec.ts`](tests/api/movies.api.spec.ts)                                                                                               |
| ➕  | Pruebas de contrato (esquemas zod)                      | [`tests/api/movies.contract.spec.ts`](tests/api/movies.contract.spec.ts) · [`src/contracts/movieApiSchemas.ts`](src/contracts/movieApiSchemas.ts)            |
| ➕  | Presupuestos de rendimiento                             | [`tests/performance/navigationTiming.performance.spec.ts`](tests/performance/navigationTiming.performance.spec.ts)                                           |
| ➕  | Regresión visual (opt-in fuera de Linux)                | [`tests/visual/pages.visual.spec.ts`](tests/visual/pages.visual.spec.ts)                                                                                     |
| ➕  | Tagging de smoke                                        | `@smoke` — [`tests/mock/searchMovie.mock.spec.ts`](tests/mock/searchMovie.mock.spec.ts) · [`tests/mock/top250.mock.spec.ts`](tests/mock/top250.mock.spec.ts) |

---

## ✨ Puntos destacados

- **Un set de Page Objects, tres backends** — las mismas abstracciones manejan el mock, el motor de mutación y el sitio real.
- **Solo locators semánticos** — `getByRole`, `getByTestId`, `getByPlaceholder`. Cero XPath, cero CSS.
- **Page Objects inyectados** vía fixtures de Playwright — las specs se leen como lenguaje natural.
- **Servidor mock determinista** — un router renderiza HTML con forma de IMDb desde una única fuente de datos; sin flakiness y offline.
- **🧬 Escenarios mutantes que aprenden** — los flujos golden se mutan en muchos escenarios auto-verificables, priorizados con aprendizajes previos.
- **♿ Chequeos de accesibilidad** — axe-core bloquea violaciones serias/críticas en cada página mock.
- **Matchers propios** — `toBeValidRating`, `toBeValidReleaseYear` para aserciones expresivas de dominio.
- **E2E honesto** — las pruebas reales hacen `skip` con motivo claro ante el muro anti-bot, en lugar de fallar.
- **🔒 POCs de servicio de auditoría** — escáner de exposición web, análisis estático de Android y mutantes que miden el kill rate del propio auditor.
- **Pruebas de API + contrato** — `request` de Playwright contra un backend mock real en proceso, esquemas validados con zod vía el matcher propio `toMatchSchema`.
- **📈 Presupuestos de rendimiento** — chequeos de Navigation Timing en cada página mock, con umbrales deliberadamente holgados.
- **🖼️ Regresión visual** — baselines `toHaveScreenshot` generadas en Linux vía Docker, opt-in en otros sistemas.
- **🏷️ Tagging de smoke** — `@smoke` marca un happy path por caso obligatorio para un chequeo rápido antes de pushear.
- **Listo para CI** — GitHub Actions corre lint + typecheck + cada suite determinista (mock, mutación, auditoría, API, contrato, rendimiento, visual) y sube reportes.

---

## 🏗️ Arquitectura

```mermaid
flowchart TD
  subgraph Tests["🧪 Tests"]
    T1["specs mock"]
    T2["specs mutación"]
    T3["specs e2e"]
  end

  subgraph Fixtures["🔌 Fixtures (Inyección de dependencias)"]
    F1["pageFixtures — inyecta Page Objects"]
    F2["mockFixtures — instala el router mock"]
  end

  subgraph Support["🛠️ Soporte"]
    X1["mutations — genera mutantes"]
    X2["mutationInsights — aprende/prioriza"]
    X3["customMatchers"]
    X4["botWall"]
  end

  subgraph Pages["📄 Page Objects (POM)"]
    B["BasePage (abstracta)"]
    PO["HomePage · SearchResultsPage · MovieDetailsPage · Top250Page"]
    N["HeaderNav (componente)"]
  end

  subgraph Mock["🎭 Backend mock"]
    R["imdbMockRouter"]
    P["pageTemplates"]
    D["movies.ts — fuente única de verdad"]
  end

  Live["🌐 IMDb real"]

  T1 --> F2
  T2 --> F2
  T2 --> X1 --> X2
  T3 --> F1
  T3 --> X4
  F2 --> F1
  F1 --> Pages
  PO --> B
  PO --> N
  F2 -.instala.-> R --> P --> D
  Pages -->|mock / mutación| R
  Pages -->|e2e| Live
```

---

## 📁 Estructura del proyecto

```text
civica-playwright-challenge/
├── src/
│   ├── config/testConfig.ts        # Config tipada y multi-entorno (TEST_ENV)
│   ├── fixtures/
│   │   ├── pageFixtures.ts          # Page Objects como fixtures inyectables (DI)
│   │   ├── mockFixtures.ts          # Agrega el router mock automático
│   │   └── apiFixtures.ts           # Servidor mock de API (worker-scoped) + request context
│   ├── contracts/movieApiSchemas.ts # 📐 Esquemas zod para las pruebas de API/contrato
│   ├── pages/
│   │   ├── basePage.ts              # Padre abstracto: navegación compartida
│   │   ├── homePage.ts              # Home + búsqueda global
│   │   ├── searchResultsPage.ts     # Página de resultados
│   │   ├── movieDetailsPage.ts      # Título, rating, año, géneros, duración
│   │   ├── top250Page.ts            # Chart Top 250 + integridad del ranking
│   │   └── components/headerNav.ts  # Componente de menú reutilizable (composición)
│   ├── support/
│   │   ├── customMatchers.ts        # toBeValidRating / toBeValidReleaseYear
│   │   ├── botWall.ts               # Detección honesta del muro anti-bot (e2e)
│   │   ├── mutations.ts             # 🧬 Generador de escenarios mutantes
│   │   ├── mutationInsights.ts      # Bucle de aprendizaje (cargar + priorizar)
│   │   └── mutationPaths.ts         # Ubicación del ledger
│   ├── audit/                       # 🔒 POCs del servicio de auditoría — ver docs/AUDIT-POC.md
│   └── utils/logger.ts              # Único punto de logging
├── tests/
│   ├── mock/                        # Suite determinista (por defecto) + a11y
│   ├── mutation/                    # 🧬 Escenarios mutantes que aprenden
│   ├── audit/                       # 🔒 POCs de auditoría (web / móvil / mutantes)
│   ├── api/                         # Pruebas de API + contrato (sin navegador)
│   ├── performance/                 # 📈 Presupuestos de Navigation Timing
│   ├── visual/                      # 🖼️ Baselines toHaveScreenshot (opt-in fuera de Linux)
│   └── e2e/                         # Suite del sitio real (opt-in)
├── mocks/
│   ├── data/movies.ts · accountApp.ts · androidApp.ts · movieApi.ts   # Catálogos — fuente única de verdad
│   └── server/                      # Routers de interceptación + plantillas HTML + apiMockServer.ts
├── reporters/
│   ├── mutationInsightsReporter.ts         # Escribe el ledger de mutantes de búsqueda
│   └── auditMutationInsightsReporter.ts    # 🔒 Escribe el ledger de mutantes de seguridad
├── docs/                            # Guías, ADRs, diagramas, capturas
│   ├── GROWTH.md · MIGRATION.md · MUTATION-TESTING.md · AUDIT-POC.md
│   └── adr/0001…0006-*.md
├── .github/workflows/ci.yml         # Pipeline de CI
├── Dockerfile                       # Ejecución con paridad de CI
├── eslint.config.js · playwright.config.ts · tsconfig.json
└── package.json
```

---

## 🧱 Principios de diseño

### Page Object Model

Cada página es una clase que oculta _cómo_ interactuar con la UI detrás de
métodos que revelan intención (`searchFor`, `openFirstResult`, `openMovieAtRank`).

### SOLID, aplicado con pragmatismo

| Principio                         | Cómo aparece aquí                                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S** — Responsabilidad única     | `testConfig` maneja el entorno; `logger` el logging; cada página una pantalla; el router la interceptación; `mutations` la generación; el reporter la persistencia. |
| **O** — Abierto/cerrado           | `BasePage` centraliza lo común; las páginas la _extienden_. Nuevos mutadores/páginas se enchufan sin editar lo existente.                                           |
| **L** — Sustitución de Liskov     | Todo Page Object es un `BasePage` intercambiable; los fixtures los tratan igual.                                                                                    |
| **I** — Segregación de interfaces | `MovieDetailsPage` expone solo los datos bajo prueba; nada más.                                                                                                     |
| **D** — Inversión de dependencias | Los tests dependen de fixtures inyectados, no de la construcción. Mock vs. real se cambia sin tocar una aserción.                                                   |

### Otras convenciones

- **camelCase** en archivos/variables/métodos; **PascalCase** en clases/tipos.
- **TypeScript estricto** + **ESLint** (política de 0 warnings) + **Prettier**.
- **Datos DRY** — los valores esperados se importan del mismo módulo que renderiza el mock.
- **Composición sobre herencia** — el menú es un componente que las páginas componen.
- Decisiones relevantes registradas como [ADRs](docs/adr).

---

## 🎯 Estrategia de locators — sin XPath/CSS

| Elemento                | Locator                                                   | Por qué                      |
| ----------------------- | --------------------------------------------------------- | ---------------------------- |
| Caja de búsqueda        | `getByPlaceholder('Search IMDb')`                         | Texto visible al usuario     |
| Botón de menú           | `getByRole('button', { name: /open navigation menu/i })`  | Rol + nombre accesible       |
| Enlace "Top 250 Movies" | `getByRole('link', { name: /top 250 movies/i })`          | Rol + nombre accesible       |
| Título de la película   | `getByTestId('hero__pageTitle')`                          | test id estable de IMDb      |
| Rating                  | `getByTestId('hero-rating-bar__aggregate-rating__score')` | test id estable de IMDb      |
| Año de estreno          | `getByRole('link', { name: /^(19\|20)\d{2}$/ })`          | Rol + forma semántica        |
| Película en el ranking  | `getByRole('link', { name: /^\d+\.\s/ })`                 | Nombre accesible con ranking |

> Resistentes (sobreviven refactors de DOM/estilos) y con significado (los fallos
> apuntan a algo visible) — justo por eso Playwright los recomienda sobre XPath/CSS.

---

## 🧪 Escenarios de prueba

### TC1 · Buscar y validar película

Home → buscar "Inception" → abrir el resultado → validar el título en la ficha.
Ampliado con cobertura **data-driven** sobre todo el catálogo, variante
**insensible a mayúsculas**, ruta **negativa** ("sin resultados") y
**validaciones profundas** (rating en rango, año plausible, géneros, duración,
URL canónica).

### TC2 · Navegar Top 250 (vía menú)

Home → menú → Top 250 → abrir el #1 → validar **título + rating + año**. Más una
prueba de **integridad del ranking**: el chart está poblado y correctamente
ordenado.

---

## 🧬 Escenarios mutantes — cobertura que aprende

La capa a futuro del framework: en vez de escribir a mano cada caso borde, los
**flujos golden se mutan** en muchos escenarios auto-verificables, y las
**ejecuciones anteriores le enseñan a la siguiente** qué mutantes importan más.

```mermaid
flowchart LR
  G["🎯 Flujo golden"] --> M["🧬 Generar mutantes<br/>equivalente · frontera · negativo"]
  L["📒 Ledger de aprendizajes"] --> P["⚖️ Priorizar<br/>fallando → nuevos → pasando"]
  M --> P --> R["▶️ Ejecutar"] --> Rep["📝 Reporter"] --> L
  L -. "alimenta la próxima corrida" .-> P
```

| Clase        | Intención                         | Ejemplo (`Inception`)        | Esperado            |
| ------------ | --------------------------------- | ---------------------------- | ------------------- |
| `equivalent` | No debe cambiar el comportamiento | `INCEPTION`, `  Inception  ` | igual: la encuentra |
| `boundary`   | Borde que debe seguir funcionando | `Incep` (parcial)            | igual: la encuentra |
| `negative`   | El comportamiento debe cambiar    | `zzqxw404movie`              | sin resultados      |

```bash
npm run test:mutation
cat test-results/mutation-insights.json   # lo que aprendió
```

📖 Fundamento completo, bucle de aprendizaje y roadmap: **[docs/MUTATION-TESTING.md](docs/MUTATION-TESTING.md)**.

---

## ♿ Accesibilidad

Cada página mock se escanea con **axe-core**
([`accessibility.mock.spec.ts`](tests/mock/accessibility.mock.spec.ts)),
bloqueando violaciones `serias`/`críticas` WCAG 2 A/AA — una vara pragmática y
sin flakiness. Como el mock es determinista, los chequeos son estables y offline.

```bash
npm run test:a11y
```

---

## 🔒 POCs de auditoría — futuro servicio de seguridad

Un preview de un servicio construido con el mismo enfoque mock-first: escanear
qué expone un flujo por la red, qué declara un paquete Android, y medir el
kill rate del propio auditor con mutantes de seguridad — todo offline, todo
sobre fixtures.

```bash
npm run test:audit
```

- **Exposición web** — fugas de PII/secretos (emails, teléfonos, números de
  tarjeta validados con Luhn, JWTs/API keys), headers CSP/HSTS/X-Content-Type-Options
  faltantes, cookies sin Secure/HttpOnly/SameSite.
- **Auditoría estática móvil** — permisos peligrosos, componentes exportados,
  tráfico en claro, builds debuggables, secretos hardcodeados, desde un
  fixture de manifest decodificado (ruta documentada hacia un APK real vía `rea`).
- **Mutantes de seguridad** — inyectan un defecto a la vez sobre una base
  endurecida y verifican que los escáneres lo detecten; kill rate actual
  **6/6 (100%)**.

📖 Qué demuestra cada POC, cómo correrlo y sus límites honestos:
**[docs/AUDIT-POC.md](docs/AUDIT-POC.md)**.

---

## 🎭 ¿Por qué una capa de mocks?

Correr la suite `e2e` contra el sitio real devuelve el muro anti-bot de IMDb en
lugar de la app:

<div align="center">
  <img src="docs/img/imdb-bot-wall.png" alt="Muro anti-bot de IMDb" width="480">
  <p><em>IMDb recibe a la automatización con un muro de verificación humana — fuera de nuestro control.</em></p>
</div>

Por eso el proyecto `mock` intercepta cada request (`page.route`) y responde con
**HTML con forma de IMDb renderizado desde una única fuente de datos** — los
mismos roles y `data-testid` que consultan los Page Objects. El resultado es una
réplica rápida, offline y 100% determinista que manejan los mismos tests:

<div align="center">
  <img src="docs/img/mock-movie.png" alt="Ficha de película mock" width="32%">
  <img src="docs/img/mock-top250.png" alt="Chart Top 250 mock" width="32%">
  <img src="docs/img/mock-find.png" alt="Resultados de búsqueda mock" width="32%">
  <p><em>El mock en proceso: ficha · Top 250 · resultados de búsqueda.</em></p>
</div>

Y cuando el sitio real _sí_ responde, E2E corre el flujo idéntico; cuando no,
**hace skip honesto** con motivo documentado — nunca un rojo falso.

---

## 🚀 Cómo empezar

### Requisitos

- **Node.js ≥ 18** · npm

### Instalar y correr

```bash
git clone https://github.com/criguex/civica-playwright-challenge.git
cd civica-playwright-challenge
npm install          # instala también Chromium (postinstall)

npm test             # suite mock determinista (siempre verde)
npm run test:mutation# escenarios mutantes que aprenden
npm run test:api     # pruebas de API + contrato contra el backend mock
npm run test:e2e     # IMDb real (opt-in; skip ante el muro anti-bot)
```

---

## 🧰 Scripts disponibles

| Script                                           | Descripción                                 |
| ------------------------------------------------ | ------------------------------------------- |
| `npm test`                                       | Suite **mock** (por defecto, siempre verde) |
| `npm run test:mock`                              | Igual, explícito                            |
| `npm run test:mutation`                          | 🧬 Escenarios mutantes que aprenden         |
| `npm run test:a11y`                              | Solo accesibilidad (`@a11y`)                |
| `npm run test:audit`                             | 🔒 POCs del servicio de auditoría           |
| `npm run test:api`                               | Pruebas de API contra el backend mock       |
| `npm run test:contract`                          | 📐 Pruebas de contrato (esquemas)           |
| `npm run test:performance`                       | 📈 Presupuestos de rendimiento              |
| `npm run test:visual`                            | 🖼️ Regresión visual (baselines Linux)       |
| `npm run test:visual:update`                     | Regenera las baselines visuales             |
| `npm run test:smoke`                             | 🏷️ Subconjunto rápido `@smoke`              |
| `npm run test:e2e`                               | Suite IMDb real (opt-in)                    |
| `npm run test:all`                               | Todos los proyectos                         |
| `npm run test:headed` / `test:ui` / `test:debug` | Visible / interactivo / paso a paso         |
| `npm run report`                                 | Abre el último reporte HTML                 |
| `npm run lint` / `lint:fix`                      | ESLint                                      |
| `npm run typecheck`                              | `tsc --noEmit`                              |
| `npm run format` / `format:check`                | Prettier                                    |
| `npm run codegen`                                | Playwright codegen contra IMDb              |

---

## ⚙️ Configuración

Todo en [`playwright.config.ts`](playwright.config.ts) + [`src/config/testConfig.ts`](src/config/testConfig.ts):

- **Navegador** — Chromium (`Desktop Chrome`) por proyecto; se extiende a Firefox/WebKit fácilmente.
- **Reporters** — `list` + `html` + `junit` + el ledger de mutación.
- **Entornos** — `TEST_ENV=prod|staging|dev` selecciona la base URL; `BASE_URL` la sobreescribe. El router mock intercepta el origen elegido.
- **Diagnóstico** — trace en el primer retry, screenshot + video ante fallo.
- **Locale** — forzado a `en-US` para copy/test-ids deterministas.

---

## 📊 Reportes y artefactos

- **Reporte HTML** → `playwright-report/` (`npm run report`).
- **JUnit XML** → `test-results/junit.xml` (dashboards de CI).
- **Ledger de mutación** → `test-results/mutation-insights.json` (insumo de aprendizaje).
- **Reportes de auditoría** → `test-results/audit/*.json`+`.html` y `test-results/audit-mutation-insights.json` (ver [AUDIT-POC.md](docs/AUDIT-POC.md)).
- **Baselines visuales** → `tests/visual/*-snapshots/*-linux.png` (commiteadas); los diffs caen en `test-results/` ante un mismatch.
- **Ante fallo** → screenshot, video y trace adjuntos automáticamente.

---

## 🤖 Integración continua

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) corre en cada push/PR a `main`:

```mermaid
flowchart LR
  A[Checkout] --> B[Node 20]
  B --> C[npm ci]
  C --> D[Instalar Chromium]
  D --> E[Lint]
  E --> F[Typecheck]
  F --> G[Suite mock + a11y]
  G --> H[Suite mutación]
  H --> I[Suite de POCs de auditoría]
  I --> K[Suite de API]
  K --> L[Suite de contrato]
  L --> M[Suite de rendimiento]
  M --> N[Suite de regresión visual]
  N --> J[Subir reporte + ledgers]
```

CI corre cada proyecto determinista, así el pipeline es rápido y nunca falla
por las defensas anti-bot de IMDb. `e2e` es opt-in y no forma parte de este
job (ver [Tipos de prueba](#-tipos-de-prueba)).

---

## 📈 Crecer y migrar

- **[docs/GROWTH.md](docs/GROWTH.md)** — agregar páginas, navegadores, entornos, Allure, sharding, husky; API/contrato/regresión visual ya están implementadas, ver [Tipos de prueba](#-tipos-de-prueba).
- **[docs/MIGRATION.md](docs/MIGRATION.md)** — reapuntar a otro sitio/app, correr en Docker, grids cloud (BrowserStack/Sauce), otros CI (GitLab/Azure/Jenkins), actualizar Playwright.
- **[docs/MUTATION-TESTING.md](docs/MUTATION-TESTING.md)** — extender el motor de cobertura que aprende.
- **[docs/AUDIT-POC.md](docs/AUDIT-POC.md)** — los POCs del servicio de auditoría de seguridad, y cómo escalarlos a una app real.
- **[docs/adr/](docs/adr)** — las decisiones detrás del diseño.

---

## 🛠️ Stack técnico

| Herramienta                                                      | Rol                                              |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| [Playwright Test](https://playwright.dev/)                       | Runner, automatización, fixtures, reporters      |
| [TypeScript](https://www.typescriptlang.org/)                    | Tipado estricto                                  |
| [axe-core](https://github.com/dequelabs/axe-core)                | Motor de accesibilidad                           |
| [zod](https://zod.dev/)                                          | Validación de esquemas (pruebas de contrato)     |
| [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) | Linting + formato                                |
| [GitHub Actions](https://github.com/features/actions)            | CI                                               |
| [Docker](https://www.docker.com/)                                | Ejecución con paridad Linux + baselines visuales |

---

## 👤 Autor

**Cristian Guerra** — QA Automation Engineer · [GitHub @criguex](https://github.com/criguex)

Hecho como entrega de un reto técnico. Licencia [MIT](LICENSE).
