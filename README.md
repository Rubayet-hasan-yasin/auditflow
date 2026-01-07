# AuditFlow API

A backend service for managing buyer requests, factory evidence, and audit workflows. Built with NestJS and designed for simplicity.

## ✨ Features Implemented

### Phase 1: Authentication & User Management
- ✅ JWT-based authentication with Passport.js
- ✅ Role-based access control (Buyer, Factory, Admin)
- ✅ User registration and login
- ✅ Protected routes with guards
- ✅ Factory isolation (factory users limited to their own data)

### Phase 2: Evidence Management (Factory Only)
- ✅ Create evidence documents with metadata
- ✅ Automatic version tracking (v1, v2, v3...)
- ✅ Add new versions to existing evidence
- ✅ Get all evidence for factory
- ✅ Get specific evidence by ID
- ✅ Delete evidence
- ✅ Factory isolation enforcement

### Phase 3: Audit Logging
- ✅ Comprehensive audit trail for all actions
- ✅ Captures actor, role, action type, object details
- ✅ Structured metadata storage
- ✅ Query and filter audit logs

---

## What's Inside

This project uses **NestJS** with **TypeScript**, **SQLite** for data storage, and **JWT** for authentication. Passwords are securely hashed with bcrypt.

The codebase is organized into three main modules:

**Auth Module** — Handles user registration, login, and JWT token management. Includes guards for protecting routes and role-based access control.

**User Module** — Manages user data and provides services for finding, creating, updating, and deactivating users.

**Helper Module** — Contains shared utilities like password hashing functions and centralized environment configuration.

---

## Project Structure

```
src/
├── auth/                    # Authentication & authorization
│   ├── decorators/          # CurrentUser, Roles decorators
│   ├── dto/                 # Login & Register DTOs
│   ├── guards/              # JWT and Roles guards
│   ├── strategies/          # Passport JWT strategy
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
│
├── evidence/                # Evidence management (factory only)
│   ├── dto/                 # Evidence & version DTOs
│   ├── entities/            # Evidence & version entities
│   ├── evidence.controller.ts
│   ├── evidence.module.ts
│   └── evidence.service.ts
│
├── audit/                   # Audit logging
│   ├── entities/            # AuditLog entity
│   ├── audit.module.ts
│   └── audit.service.ts
│
├── user/                    # User management
│   ├── entities/            # User entity
│   ├── user.module.ts
│   └── user.service.ts
│
├── helper/                  # Shared utilities
│   ├── config/              # Environment & database config
│   └── utils/               # Bcrypt utilities
│
├── scripts/
│   └── seed.ts              # Database seeder
│
├── app.module.ts
└── main.ts
```

---

## Getting Started

**1. Install dependencies**

```bash
npm install
```

**2. Set up environment (optional)**

Copy the example file and adjust values if needed:

```bash
cp .env.example .env
```

Default values work out of the box for development.

**3. Seed the database**

```bash
npm run seed
```

**4. Start the server**

```bash
npm run start:dev
```

The API will be running at `http://localhost:3000`

---

## Test Users

After seeding, these accounts are available:

| Email | Password | Role |
|-------|----------|------|
| admin@auditflow.com | admin123 | Admin |
| buyer@auditflow.com | buyer123 | Buyer |
| buyer2@auditflow.com | buyer123 | Buyer |
| factory1@auditflow.com | factory123 | Factory (F001) |
| factory2@auditflow.com | factory123 | Factory (F002) |

---

## API Testing with cURL

### Register a new user

**Buyer registration:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret123","firstName":"John","lastName":"Doe","role":"buyer"}'
```

**Factory registration** (requires factoryId):
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"factory@example.com","password":"secret123","firstName":"Factory","lastName":"Manager","role":"factory","factoryId":"F003"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@auditflow.com","password":"buyer123"}'
```

**Save the token for next requests:**
```bash
export FACTORY_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"factory1@auditflow.com","password":"factory123"}' | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

echo "Token: $FACTORY_TOKEN"
```

### Get your profile (protected route)

Replace `YOUR_TOKEN` with the accessToken from login response:

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Evidence Management (Factory Only)

**Create Evidence**
```bash
curl -X POST http://localhost:3000/evidence \
  -H "Authorization: Bearer $FACTORY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"ISO 9001 Certificate",
    "docType":"Certificate",
    "expiry":"2026-12-31",
    "notes":"Initial ISO certification"
  }'
```

**Response:**
```json
{
  "evidenceId": "550e8400-e29b-41d4-a716-446655440000",
  "versionId": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Get All Evidence for Factory**
```bash
curl -X GET http://localhost:3000/evidence \
  -H "Authorization: Bearer $FACTORY_TOKEN"
```

**Get Specific Evidence**
```bash
curl -X GET http://localhost:3000/evidence/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $FACTORY_TOKEN"
```

**Add New Version to Evidence**
```bash
curl -X POST http://localhost:3000/evidence/550e8400-e29b-41d4-a716-446655440000/versions \
  -H "Authorization: Bearer $FACTORY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes":"Renewed ISO certification",
    "expiry":"2027-12-31"
  }'
```

**Response:**
```json
{
  "versionId": "770e8400-e29b-41d4-a716-446655440002",
  "versionNumber": 2
}
```

**Delete Evidence**
```bash
curl -X DELETE http://localhost:3000/evidence/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $FACTORY_TOKEN"
```

### Quick one-liner test

Login and see the response:

```bash
curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"buyer@auditflow.com","password":"buyer123"}' | json_pp
```

---

## Comprehensive Features

### Evidence Management (Factory Only)

The Evidence module allows factories to create, version, and manage compliance documents with full audit trail support.

**Key Features:**
- ✅ Factory-isolated evidence creation (cannot access other factory's evidence)
- ✅ Automatic versioning with sequential version numbers
- ✅ Support for multiple document types (Certificate, Test Report, Audit Report, etc.)
- ✅ Expiry date tracking for compliance monitoring
- ✅ Full audit logging on all operations
- ✅ Version history preservation

**Role-Based Access Control:**
- Only users with `factory` role can create evidence
- Factory users can only see and manage their own factory's evidence
- Attempting to access evidence from another factory returns `403 Forbidden`

### Audit Logging

Every action in the system is logged with complete context:

**Audit Record Contains:**
- `timestamp` — When the action occurred
- `actorUserId` — Who performed the action
- `actorRole` — User's role (factory, buyer, admin)
- `action` — Type of action (CREATE_EVIDENCE, ADD_VERSION, etc.)
- `objectType` — What was affected (Evidence, Version, Request)
- `objectId` — ID of the affected object
- `metadata` — Additional context (factoryId, docType, version number, etc.)

**Logged Actions:**
- `CREATE_EVIDENCE` — When a factory creates new evidence
- `ADD_VERSION` — When a factory adds a new version
- `DELETE_EVIDENCE` — When a factory deletes evidence

---

| Role | What they can do |
|------|------------------|
| **Buyer** | Create requests, view status, work with factories |
| **Factory** | Submit evidence, fulfill requests for their factory |
| **Admin** | Full access to everything |

---

## Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# With coverage report
npm run test:cov
```

---

## Architecture & Best Practices

### Security Implementation

**1. Authentication & Authorization**
- JWT tokens with configurable expiration
- Password hashing with bcrypt (10 salt rounds)
- Role-based guards enforce access at endpoint level
- Factory isolation prevents cross-factory data access

**2. Input Validation**
- All DTOs validated using class-validator
- Type safety enforced with TypeScript
- Global validation pipe with whitelist enabled

**3. Data Isolation**
- Evidence queries always include factoryId filter
- Service layer enforces ownership checks
- 403 Forbidden returned for unauthorized access

**4. Audit Trail**
- Immutable audit log records
- Captures complete context for compliance
- Cannot be modified or deleted

### Database Design

**Entities:**
- `User` — User accounts with roles (buyer, factory, admin)
- `Evidence` — Compliance documents owned by factories
- `EvidenceVersion` — Version history for evidence documents
- `AuditLog` — Immutable audit trail for all actions

**Relationships:**
- Evidence has many Versions (one-to-many, cascade delete)
- All entities linked via UUID primary keys
- SQLite for development, easily portable to PostgreSQL

### Testing Strategy

**Unit Tests: 50 tests** ✅
- Service layer business logic (Evidence, Auth, User)
- Controller routing and guards
- Data validation and error handling
- Factory isolation enforcement
- Audit logging verification

**E2E Tests: 27 tests** ✅
- Full authentication flow
- Evidence creation and versioning workflow
- Protected route access
- Role-based authorization
- Factory data isolation
- API contract validation

**Test Coverage:**
```bash
# Run all unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:cov
```

**Critical Paths Covered:**
- ✅ Evidence creation with auto-versioning
- ✅ Adding versions to evidence
- ✅ Factory isolation (cannot access other factory's data)
- ✅ Role-based access (buyers blocked from evidence endpoints)
- ✅ Audit trail for all operations
- ✅ Authentication and authorization flows
- ✅ Input validation and error cases

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment mode |
| JWT_SECRET | (built-in default) | Secret for signing tokens |
| JWT_EXPIRES_IN | 24h | Token expiration time |
| DATABASE_PATH | ./data/auditflow.db | SQLite database location |

---

