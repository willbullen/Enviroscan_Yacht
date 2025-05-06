# Architecture Documentation

## Overview

This application is a maritime management system named "Eastwind Management" that provides comprehensive tools for yacht/vessel management. It includes features for equipment maintenance, crew management, voyage planning, inventory management, ISM compliance, financial management, and real-time vessel tracking.

The system follows a modern web application architecture with a React frontend and Node.js backend. It uses a PostgreSQL database (via Neon's serverless Postgres) with Drizzle ORM for data persistence.

## System Architecture

The application follows a client-server architecture:

1. **Frontend**: React-based SPA (Single Page Application) built with Vite, utilizing Tailwind CSS for styling and Radix UI components.

2. **Backend**: Node.js/Express.js server handling API requests, authentication, and business logic.

3. **Database**: PostgreSQL database accessed via Drizzle ORM, with schemas defined in the shared directory.

4. **Authentication**: Session-based authentication with Passport.js.

5. **API**: RESTful API endpoints organized by domain (e.g., marine, equipment, finances).

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│             │      │             │      │             │
│  React SPA  │<─────│  Express.js │<─────│ PostgreSQL  │
│  Frontend   │      │  Backend    │      │ Database    │
│             │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
                           ^ 
                           │
                           v
                     ┌─────────────┐
                     │ Third-party │
                     │   Services  │
                     │   (AIS,     │
                     │    Windy)   │
                     └─────────────┘
```

## Key Components

### Frontend

1. **React Application**
   - Entry point: `client/src/main.tsx`
   - Routing: Wouter (lightweight router)
   - State Management: React Context API and React Query
   - UI Components: Shadcn/UI (built on Radix UI primitives)

2. **Core Pages**
   - Dashboard (`Dashboard.tsx`): Overview of vessel status and tasks
   - Equipment management (`Equipment.tsx`): Track yacht equipment
   - Tasks (`Tasks.tsx`): Maintenance task management
   - Financial Management (`FinancialManagement.tsx`): Expense tracking and budgeting
   - Marine Tracker (`MarineTracker.tsx`): Real-time vessel position tracking
   - Voyage Management (`VoyagesListPage.tsx`, etc.): Plan and track voyages

3. **Context Providers**
   - `VesselContext`: Manages the current vessel selection
   - `VendorContext`: Manages vendor data for financial operations
   - `SystemSettingsContext`: Manages application-wide settings
   - `AuthProvider`: Manages authentication state

### Backend

1. **Express Server**
   - Entry point: `server/index.ts`
   - API routes: `server/routes.ts`
   - Authentication: `server/auth.ts`

2. **Core Services**
   - Database access: `server/db.ts` - Connection to PostgreSQL using Drizzle ORM
   - Storage service: `server/storage.ts` - Repository pattern for data access
   - OpenAI integration: `server/openai.ts` - AI-powered features like receipt analysis

3. **Domain-specific Routes**
   - Marine tracking: `server/routes/marine.ts` - AIS vessel position tracking
   - Receipt reconciliation: `server/routes/receiptReconciliation.ts` - AI-powered expense matching
   - API keys management: `server/routes/apiKeys.ts` - External API integration management

4. **Middleware**
   - Error handling: `server/middleware/errorHandler.ts`
   - Request logging: `server/middleware/requestLogger.ts`

### Data Storage

1. **Database**
   - PostgreSQL (via Neon serverless)
   - Connection managed in `server/db.ts`
   - Schema defined in `shared/schema.ts` using Drizzle ORM

2. **Key Schemas**
   - Users and authentication
   - Vessels and equipment
   - Maintenance tasks and schedules
   - Financial records (expenses, budgets)
   - Voyage planning and tracking

## Data Flow

### Authentication Flow

1. User submits credentials to `/api/auth/login`
2. Server validates credentials using Passport.js
3. On success, a session is created and stored
4. Subsequent requests include the session cookie for authentication

### API Request Flow

1. Client makes authenticated API request
2. Request passes through logging middleware
3. Express routes handle the request and delegate to appropriate handlers
4. Business logic is executed, typically accessing the database via storage service
5. Response is sent back to the client

### Real-time Vessel Tracking Flow

1. Server establishes WebSocket connection to AIS Stream API
2. Updates are received via WebSocket when vessel positions change
3. Server processes and stores position updates
4. Clients can fetch current positions or subscribe to updates

## External Dependencies

### Marine Data

1. **AIS Stream API**
   - Real-time vessel position tracking
   - Implemented in `server/routes/marine.ts`

2. **Windy API**
   - Weather data for marine operations
   - API keys managed via environment variables

### Financial Services

1. **Banking APIs**
   - Support for integrating with banking providers (Centtrip, Revolut)
   - Transaction synchronization

### AI Services

1. **OpenAI API**
   - Receipt analysis for expense categorization
   - Implemented in `server/openai.ts`

### Map Services

1. **Leaflet**
   - Interactive maps for vessel tracking
   - Used with React Leaflet for the frontend components

## Deployment Strategy

The application is designed to be deployed on Replit, as evidenced by the `.replit` configuration file.

### Development

- Local development using Vite's dev server (`npm run dev`)
- TypeScript for type checking (`npm run check`)

### Production Build

1. Frontend:
   - Built with Vite (`vite build`)
   - Outputs to `dist/public`

2. Backend:
   - Bundled with esbuild (`esbuild server/index.ts`)
   - Outputs to `dist/index.js`

3. Database:
   - Schema management with Drizzle Kit (`npm run db:push`)

### Deployment Configuration

- Replit configuration in `.replit` file
- Environment variables for database connection, API keys, etc.
- Production mode uses `NODE_ENV=production`

### Scaling Considerations

- Uses connection pooling for database access
- Implements retry mechanisms for database operations
- Circuit breaker pattern for external API calls (e.g., AIS Stream)

## Security Considerations

1. **Authentication**
   - Session-based authentication with secure cookies
   - Password hashing using scrypt
   - CSRF protection built into Express

2. **API Security**
   - Protected routes require authentication
   - Input validation using Zod schemas
   - Error handling to prevent information leakage

3. **External Services**
   - API keys stored as environment variables
   - Rate limiting for external API calls