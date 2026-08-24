# Commons Marketplace — Backend API

Production-grade e-commerce backend built with **Node.js, Express and Onion Architecture**. Manages users, stores, products, categories, reviews and real-time messaging — deployed with Docker, Nginx and a Blue/Green CI/CD pipeline for zero-downtime releases.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Jest](https://img.shields.io/badge/Tests-1010_passed-C21325?style=flat-square&logo=jest&logoColor=white)]()
[![Coverage](https://img.shields.io/badge/Coverage-80%25-brightgreen?style=flat-square)]()
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=flat-square)]()

---

## What makes this interesting

This started as a straightforward REST API and became an exercise in making a backend that's actually maintainable at scale. Four decisions shaped the architecture:

**1. Onion Architecture** — so the domain layer has zero knowledge of MongoDB, Supabase, or any external dependency. This made testing use cases without a real database trivial, and swapping infrastructure components painless.

**2. 1010 tests across 114 suites** — written before most features were complete. Use cases at 100%, core entities at 100%, validators at 100%. The coverage discipline forced cleaner interfaces between layers.

**3. Dual real-time implementations** — the system has both a native Socket.io server and an Ably integration. Both live in the infrastructure layer and implement the same repository interface, so the core never knows which one is active. This was possible precisely because of Onion — the real-time transport is a swappable detail, not a core dependency.

**4. Blue/Green deployment** — two identical production environments. Releases switch traffic between them, so a bad deploy is a one-command rollback with no downtime.

---

## Architecture

### Onion layers

```mermaid
flowchart LR
    P["Presentation<br/>Controllers · Routes · Middlewares"] --> A["Application<br/>Use Cases · DTOs"] --> C["Core<br/>Entities · Repository Interfaces · Domain Services<br/><i>no external dependencies</i>"] --> I["Infrastructure<br/>MongoDB · Supabase · Ably · Socket.io · DI"]

    I -.->|implements| C

    style P fill:#1976d2,stroke:#0d47a1,color:#fff,stroke-width:2px
    style A fill:#7b1fa2,stroke:#4a148c,color:#fff,stroke-width:2px
    style C fill:#388e3c,stroke:#1b5e20,color:#fff,stroke-width:2px
    style I fill:#f57c00,stroke:#bf360c,color:#fff,stroke-width:2px
```

**The rule:** dependencies only point inward. `core` knows nothing about MongoDB, Express, or any framework. This is what makes unit testing use cases fast and reliable — no database setup needed, just mock the repository interface.

### Dependency flow

```mermaid
flowchart LR
    P[Presentation] --> A[Application]
    A --> C[Core]
    I[Infrastructure] --> C
    P --> I
```

### Request lifecycle

```mermaid
flowchart TD
    REQ([HTTP Request]) --> MW[Middleware chain\nauth · role · validation]
    MW -->|invalid| ERR([Custom exception → error response])
    MW -->|valid| CTRL[Controller]
    CTRL --> UC[Use Case]
    UC --> REPO[Repository interface]
    REPO --> IMPL[Infrastructure impl\nMongoDB · Supabase]
    UC -->|side effects| EXT[External services\nAbly · Storage]
    IMPL --> RES([Response DTO])
```

---

## Key design decisions

### Why Onion Architecture over MVC?

MVC works fine for small APIs. At ~50 endpoints with role-based auth, ownership checks, and multiple external services, a flat MVC structure mixes concerns in ways that make testing painful. Onion makes the business logic layer independently testable — no Express, no MongoDB, no Supabase required in unit tests.

### Why Supabase for auth?

JWT signing, token rotation, and session management are security-critical and easy to get wrong. Delegating that to Supabase means not writing or maintaining that code. The tradeoff is an external dependency — acceptable given the reliability guarantees.

### Why two real-time implementations — Socket.io and Ably?

The system has both a native Socket.io server (`infrastructure/websocket`) and an Ably integration (`infrastructure/ably`). Both implement the same `IChatRepository` interface defined in core, so use cases never know which transport is active.

Socket.io gives full control with zero external dependency. Ably handles reconnection, presence, and delivery guarantees out of the box. Having both is possible precisely because of Onion Architecture — the transport is an infrastructure detail. Switching between them is a single DI binding change, not a rewrite.

### Why Jest with mocks instead of integration tests?

Integration tests against a real MongoDB instance are slow and flaky in CI. By mocking repository interfaces, use case tests run in milliseconds and fail deterministically. Integration tests exist but are intentionally minimal.

---

## Test coverage

```
Test Suites:  114 passed, 114 total
Tests:       1010 passed, 1010 total
Statements:  ~80%
Branches:    ~70%
```

| Layer          | Coverage | Notes                                                                                                                       |
| -------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| Use Cases      | 100%     | Core business logic, fully mocked                                                                                           |
| Core Entities  | 100%     | Domain models                                                                                                               |
| Validators     | 100%     | All input paths covered                                                                                                     |
| Controllers    | ~90%     | HTTP handling layer                                                                                                         |
| Services       | ~80%     | Domain logic                                                                                                                |
| Infrastructure | ~25%     | Express, WebSocket, logger and cache intentionally excluded from unit tests — require real integration tests with Supertest |

---

## Stack

| Layer        | Technology                                   |
| ------------ | -------------------------------------------- |
| Runtime      | Node.js 18+                                  |
| Framework    | Express.js 5.x                               |
| Language     | JavaScript (ES Modules)                      |
| Architecture | Onion / DDD                                  |
| Database     | MongoDB + Mongoose                           |
| Auth         | Supabase (JWT)                               |
| Real-time    | Socket.io (native) + Ably — swappable via DI |
| File storage | Supabase Storage                             |
| Testing      | Jest 29                                      |
| Logging      | Winston (structured)                         |
| Docs         | Swagger / OpenAPI 3.0                        |
| Containers   | Docker + Nginx (SSL)                         |
| Deployment   | Blue/Green CI/CD                             |

---

## Project structure

```
src/
├── core/                   # Domain — no external dependencies
│   ├── entities/           # Domain models
│   ├── repositories/       # Repository interfaces
│   └── services/           # Domain services
├── application/            # Use cases + DTOs
│   ├── use-cases/
│   └── dtos/
├── infrastructure/         # Implementations
│   ├── supabase/           # Auth + storage client
│   ├── ably/               # Ably real-time client
│   ├── websocket/          # Native Socket.io server
│   ├── di/                 # Dependency injection
│   └── logger/             # Winston config
├── presentation/           # HTTP layer
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/        # Auth · role · ownership
│   ├── validators/
│   └── exceptions/         # Custom error hierarchy
└── app.js
```

---

## API surface

50+ documented endpoints across 7 domains. Full interactive docs available at `/api-docs` in development.

| Domain     | Endpoints                                                              |
| ---------- | ---------------------------------------------------------------------- |
| Auth       | Register · Login · Logout                                              |
| Users      | Profile · CRUD · Avatar upload                                         |
| Stores     | CRUD · Approval workflow (pending / approved / rejected)               |
| Products   | CRUD · Inventory · Image upload                                        |
| Categories | Hierarchical (parent / child)                                          |
| Reviews    | Ratings + comments                                                     |
| Chat       | Conversations · Messages · Real-time via Socket.io or Ably (swappable) |

---

## Getting started

### Requirements

- Node.js 18+
- Docker + Docker Compose
- [Supabase](https://supabase.com) project (free tier)
- [Ably](https://ably.com) account (free tier)

### Local development

```bash
git clone https://github.com/CARLOSGRCIAGRCIA/commons-marketplace.git
cd commons-marketplace
npm install
cp .env.example .env   # fill in your credentials
docker-compose up -d   # starts MongoDB
npm run dev
```

API docs: `https://localhost:8443/api-docs`

### Environment variables

```env
# MongoDB
DB_URL=mongodb://admin:admin123@mongodb:27017/CommonMarketplaceServiceDB?authSource=admin

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_publishable_key
SUPABASE_SECRET_KEY=sb_secret_your_secret_key
SUPABASE_STORAGE_BUCKET=CommonMarketplace

# Ably
ABLY_API_KEY=your_ably_key

# Server
PORT=3000
NODE_ENV=development
```

### Scripts

```bash
npm run dev       # development with hot-reload
npm test          # run test suite
npm run coverage  # coverage report
npm run lint      # check code style
npm run lint:fix  # auto-fix
```

---

## License

ISC — see [LICENSE](LICENSE) for details.

---

Built by [Carlos Garcia](https://github.com/CARLOSGRCIAGRCIA)
