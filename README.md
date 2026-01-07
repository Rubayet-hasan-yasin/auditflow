# AuditFlow API

A backend service for managing buyer requests, factory evidence, and audit workflows. Built with NestJS and designed for simplicity.

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

### Get your profile (protected route)

Replace `YOUR_TOKEN` with the accessToken from login response:

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Quick one-liner test

Login and see the response:

```bash
curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"buyer@auditflow.com","password":"buyer123"}' | json_pp
```

---

## User Roles

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

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment mode |
| JWT_SECRET | (built-in default) | Secret for signing tokens |
| JWT_EXPIRES_IN | 24h | Token expiration time |
| DATABASE_PATH | ./data/auditflow.db | SQLite database location |

---

