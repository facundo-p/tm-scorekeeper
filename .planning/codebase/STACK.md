# Technology Stack

**Analysis Date:** 2026-03-19

## Languages

**Primary:**
- TypeScript 5.6.3 - Frontend application and type checking
- Python 3.12 - Backend API and business logic

**Secondary:**
- JavaScript - Package scripts and configuration
- SQL - Database queries via SQLAlchemy ORM

## Runtime

**Environment:**
- Node.js 20 (Alpine) - Frontend development and builds
- Python 3.12 - Backend runtime and application server

**Package Manager:**
- npm 10 (Node.js package manager)
  - Lockfile: `package-lock.json` (present)
- pip - Python package manager
  - Lockfile: `requirements.txt` (present)

## Frameworks

**Core:**
- React 18.3.1 - Frontend UI library
- FastAPI 0.112.0+ - Backend REST API framework
- react-router-dom 6.28.0 - Frontend client-side routing

**Build/Dev:**
- Vite 6.0.5 - Frontend build tool and dev server
- Uvicorn 0.40.0+ - ASGI application server for FastAPI
- Alembic 1.18.4 - Database migration tool for SQLAlchemy

**Testing:**
- Vitest 3.2.4 - Frontend unit test runner
- Playwright 1.49.1 - End-to-end testing framework
- pytest 8.0.0+ - Backend unit and integration testing
- jsdom 25.0.1 - DOM environment for testing React components

## Key Dependencies

**Critical:**
- SQLAlchemy 1.4+ - Python ORM for database abstraction
- Pydantic 2.12.5+ - Data validation for FastAPI request/response schemas
- psycopg2-binary - PostgreSQL adapter for Python database connections
- httpx 0.28.0+ - HTTP client library for async operations

**Testing Libraries:**
- @testing-library/react 16.1.0 - Utilities for testing React components
- @testing-library/jest-dom 6.6.3 - Custom Jest matchers for DOM testing
- @testing-library/user-event 14.5.2 - User interaction simulation for tests

**Type Support:**
- @types/react 18.3.12 - TypeScript types for React
- @types/react-dom 18.3.1 - TypeScript types for React DOM
- @types/node 25.3.3 - TypeScript types for Node.js APIs

**Frontend Tooling:**
- @vitejs/plugin-react 4.3.4 - Vite plugin for React JSX transformation
- typescript 5.6.3 - TypeScript compiler

## Configuration

**Environment:**
- Environment variables via `.env` file (see `.env.example`)
- Runtime configuration injected from Docker Compose and platform deployment (Render)
- Frontend uses `import.meta.env.VITE_*` for build-time variables

**Build:**
- `tsconfig.json` (project reference to app and node configs)
- `tsconfig.app.json` - Application-specific TypeScript settings (target: ES2020, jsx: react-jsx)
- `tsconfig.node.json` - Node.js tooling TypeScript settings
- `vite.config.ts` - Frontend build configuration with React plugin and API proxy
- `playwright.config.ts` - E2E test configuration
- `alembic.ini` - Database migration configuration

## Platform Requirements

**Development:**
- Docker Desktop (Docker + Docker Compose)
- make command-line utility
- Python 3.12 (for local backend development)
- Node.js 20 (for local frontend development)

**Production:**
- Render.com - Backend deployment (Python ASGI)
- Vercel - Frontend deployment (assumed, referenced in docs)
- PostgreSQL 15 - Production database (Supabase or compatible)

---

*Stack analysis: 2026-03-19*
