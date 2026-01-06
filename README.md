# AuditFlow API

A NestJS-based API for managing buyer requests, factory evidence, and audit logging with robust authentication.

## Tech Stack

- **Backend**: NestJS (Node.js/TypeScript)
- **Database**: SQLite with TypeORM
- **Authentication**: JWT (JSON Web Tokens) with Passport.js
- **Password Hashing**: bcrypt
- **Validation**: class-validator & class-transformer

## Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── decorators/         # Custom decorators (CurrentUser, Roles)
│   ├── dto/                # Data Transfer Objects
│   ├── guards/             # JWT and Roles guards
│   ├── strategies/         # Passport JWT strategy
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── entities/               # TypeORM entities
│   └── user.entity.ts
├── scripts/               # Utility scripts
│   └── seed.ts            # Database seeding script
├── app.module.ts
└── main.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file (optional - defaults are provided)
cp .env.example .env
```

### Environment Variables

Create a `.env` file with:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
DATABASE_PATH=./data/auditflow.db
```

### Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### Database Seeding

Seed the database with initial users:

```bash
npm run seed
```

This creates the following test users:

| Email                     | Password    | Role    | Factory ID |
|---------------------------|-------------|---------|------------|
| admin@auditflow.com       | admin123    | admin   | -          |
| buyer@auditflow.com       | buyer123    | buyer   | -          |
| buyer2@auditflow.com      | buyer123    | buyer   | -          |
| factory1@auditflow.com    | factory123  | factory | F001       |
| factory2@auditflow.com    | factory123  | factory | F002       |

## API Endpoints

### Authentication

#### Register a New User

```bash
# Register a Buyer
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newbuyer@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "buyer"
  }'

# Register a Factory User (requires factoryId)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newfactory@example.com",
    "password": "password123",
    "firstName": "Factory",
    "lastName": "Manager",
    "role": "factory",
    "factoryId": "F003"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "newbuyer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "buyer",
    "factoryId": null
  }
}
```

#### Login

```bash
# Login as Buyer
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@auditflow.com",
    "password": "buyer123"
  }'

# Login as Factory
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "factory1@auditflow.com",
    "password": "factory123"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "buyer@auditflow.com",
    "firstName": "John",
    "lastName": "Buyer",
    "role": "buyer",
    "factoryId": null
  }
}
```

#### Get Current User Profile (Protected)

```bash
# Replace YOUR_TOKEN with the accessToken from login/register response
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "id": "uuid-here",
  "email": "buyer@auditflow.com",
  "firstName": "John",
  "lastName": "Buyer",
  "role": "buyer",
  "factoryId": null
}
```

## Testing

```bash
# Run unit tests
npm run test

# Run unit tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## User Roles

| Role    | Description                                                |
|---------|------------------------------------------------------------|
| buyer   | Can create requests, view request status                   |
| factory | Can create evidence, fulfill requests (own factory only)   |
| admin   | Full access to all features                                |

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds
2. **JWT Authentication**: Stateless authentication using JSON Web Tokens
3. **Role-Based Access Control**: Guards ensure only authorized roles can access endpoints
4. **Input Validation**: All inputs are validated using class-validator
5. **Factory Isolation**: Factory users can only access their own factory's data

## Guards and Decorators

### Using JwtAuthGuard (Protect Routes)

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller('protected')
@UseGuards(JwtAuthGuard)
export class ProtectedController {
  // All routes here require valid JWT
}
```

### Using RolesGuard (Role-Based Access)

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from './auth/guards';
import { Roles } from './auth/decorators';
import { UserRole } from './entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  
  @Get()
  @Roles(UserRole.ADMIN)
  adminOnlyRoute() {
    // Only admins can access
  }

  @Get('buyer-factory')
  @Roles(UserRole.BUYER, UserRole.FACTORY)
  buyerOrFactoryRoute() {
    // Buyers and factories can access
  }
}
```

### Using CurrentUser Decorator

```typescript
import { CurrentUser } from './auth/decorators';
import { User } from './entities/user.entity';

@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@CurrentUser() user: User) {
  return user;
}

// Get specific property
@Get('my-role')
@UseGuards(JwtAuthGuard)
getMyRole(@CurrentUser('role') role: string) {
  return { role };
}
```

## Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Seed the database
npm run seed

# 3. Start the server
npm run start:dev

# 4. Test login (in another terminal)
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"buyer@auditflow.com","password":"buyer123"}'
```

## License

UNLICENSED
