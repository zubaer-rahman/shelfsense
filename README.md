# ShelfSense

> Smart inventory, expiry tracking, and demand-based reorder suggestions for small shops.

## Monorepo Overview
- **api/**: NestJS 12 backend API with Prisma 7 LTS ORM, PostgreSQL, and strict SOLID patterns.
- **web/**: Next.js 16 frontend interface using Turbopack and vanilla CSS design system.
- **Orchestration**: Turborepo 2.x

## Getting Started

### Prerequisites
- Node.js >= 22 (Recommended v24.x)
- PostgreSQL database

### Setup
```bash
npm install
npm --workspace=api run prisma:generate
npm run dev
```

### Backend Scripts
```bash
npm --workspace=api run start:dev     # Start NestJS API dev server (http://localhost:4000/api)
npm --workspace=api run prisma:migrate # Run Prisma database migrations
npm --workspace=api run seed          # Seed demo users, products and 90 days synthetic sales
```

### Frontend Scripts
```bash
npm --workspace=web run dev          # Start Next.js web application (http://localhost:3000)
```
