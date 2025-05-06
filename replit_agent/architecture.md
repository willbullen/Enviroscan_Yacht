# Architecture Overview

## 1. Overview

Eastwind Management System is a comprehensive yacht management application designed to help manage vessel operations, maintenance, finances, crew, and voyages. The system follows a modern full-stack architecture with a clear separation between client and server components.

The application is built as a single-page application (SPA) with a React frontend and a Node.js backend. It uses a PostgreSQL database for data persistence and implements RESTful API endpoints for communication between the frontend and backend.

## 2. System Architecture

The system follows a three-tier architecture:

1. **Presentation Layer**: React-based SPA with a component-based UI architecture
2. **Application Layer**: Express.js REST API server handling business logic and data processing
3. **Data Layer**: PostgreSQL database with Drizzle ORM for data access

### 2.1 High-Level Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │ ◄─────► │   Express API   │ ◄─────► │  PostgreSQL DB  │
│                 │   REST  │                 │  Drizzle │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                     │
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  External APIs  │
                            │  - AIS Stream   │
                            │  - Windy Maps   │
                            │  - Banking APIs │
                            └─────────────────┘
```

## 3. Key Components

### 3.1 Frontend Architecture

The frontend is built using React with a component-based architecture. Key technologies include:

- **React**: Core library for building the UI
- **React Query**: For data fetching, caching, and state management
- **Wouter**: Lightweight routing library
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/UI**: Component library built on Radix UI primitives
- **Recharts**: Charting library for data visualization
- **React Hook Form**: Form handling with validation via Zod
- **Lucide**: Icon library
- **Leaflet**: Interactive mapping capabilities

The frontend is organized into the following key directories:
- `/client/src/components`: Reusable UI components
- `/client/src/pages`: Top-level page components
- `/client/src/contexts`: React context providers for state management
- `/client/src/hooks`: Custom React hooks
- `/client/src/lib`: Utility functions and shared logic

### 3.2 Backend Architecture

The backend is built using Node.js with Express.js. Key technologies include:

- **Express.js**: Web framework for handling HTTP requests
- **Drizzle ORM**: Type-safe SQL query builder and ORM
- **Passport.js**: Authentication middleware
- **OpenAI**: Integration for receipt analysis and expense categorization
- **WebSocket**: For real-time vessel tracking via AIS Stream
- **neon-serverless**: PostgreSQL client for Neon database

The backend is organized as follows:
- `/server/routes`: API route definitions
- `/server/middleware`: Express middlewares
- `/server/services`: Business logic services
- `/server/storage.ts`: Data access layer
- `/server/db.ts`: Database connection and configuration
- `/server/auth.ts`: Authentication logic

### 3.3 Database Schema

The database uses a relational schema built with Drizzle ORM. Key entities include:

- **Users**: Authentication and user management
- **Equipment**: Vessel equipment and maintenance tracking
- **Maintenance Tasks**: Scheduled and completed maintenance activities
- **Inventory Items**: Parts and supplies tracking
- **Voyages**: Journey planning and management
- **Waypoints**: Navigation points for voyages
- **Vessels**: Yacht information and tracking
- **Financial Management**: Accounts, budgets, expenses, transactions
- **Banking Integration**: Connections to banking APIs
- **Forms**: Custom form templates and submissions

The schema definitions are located in `/shared/schema.ts`, providing a single source of truth for both the frontend and backend.

## 4. Data Flow

### 4.1 API Communication

The system uses a RESTful API architecture for communication between the frontend and backend:

1. Frontend components use React Query hooks to fetch data from the API
2. API requests are made using a custom `apiRequest` function that handles authentication and error handling
3. Backend routes process requests, perform business logic, and return JSON responses
4. The backend uses a storage layer (`DatabaseStorage` class) to abstract database operations

### 4.2 Authentication Flow

The application uses session-based authentication:

1. Users log in via the `/api/auth/login` endpoint
2. Passport.js authenticates the user and establishes a session
3. Session data is stored in the database
4. Authenticated routes check for valid sessions before processing requests
5. Protected routes in the frontend redirect to the login page if not authenticated

### 4.3 Real-time Data

The application uses WebSockets for real-time vessel tracking:

1. Backend establishes a WebSocket connection to the AIS Stream service
2. When the frontend requests vessel data, the backend returns cached vessel positions
3. As new vessel position data arrives via WebSocket, it's stored in cache
4. The frontend periodically polls for updated vessel positions

## 5. External Dependencies

The system integrates with several external services:

### 5.1 Marine Tracking

- **AIS Stream API**: Real-time vessel position data via WebSocket
- **Marine Traffic API**: Alternative source for vessel data
- **Windy Maps API**: Weather and maritime forecasting

### 5.2 AI Services

- **OpenAI GPT-4o**: Used for receipt analysis and expense categorization
- **Anthropic Claude**: Alternative AI provider

### 5.3 Banking Integration

The system supports integration with banking APIs for automated financial reconciliation:
- Support for Centtrip and Revolut banking APIs
- Mock banking data for development/testing

## 6. Deployment Strategy

The application is configured for deployment on Replit with automatic scaling:

```
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]
```

The build process consists of:
1. Vite building the frontend assets
2. esbuild bundling the server code
3. Running the production server using Node.js

Database provisioning occurs through Neon PostgreSQL, with the connection string specified in environment variables.

### 6.1 Environment Configuration

The application requires the following environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `NODE_ENV`: Environment mode (development/production)
- `OPENAI_API_KEY`: For AI-powered features
- `AIS_API_KEY`: For marine vessel tracking
- `WINDY_MAP_FORECAST_KEY` and `WINDY_PLUGIN_KEY`: For weather mapping

### 6.2 Error Handling and Logging

The application implements a comprehensive logging system:
- Error logging with contextual information
- Access logging for API requests
- Performance metrics tracking
- Log rotation for production deployments

Logs are stored in both the filesystem and the database for redundancy and searchability.

## 7. Security Considerations

The application implements several security measures:

- Password hashing using scrypt with salt
- Session-based authentication with secure cookies
- CSRF protection for API requests
- Input validation using Zod schemas
- Rate limiting for authentication routes
- Circuit breaker pattern for external API calls
- Comprehensive error handling and logging

## 8. Future Architectural Considerations

Potential future improvements to the architecture could include:

1. Implementing a microservices architecture to better separate concerns
2. Adding a message queue for background processing tasks
3. Implementing GraphQL for more efficient data fetching
4. Adding WebSocket support for real-time updates to the frontend
5. Implementing a more robust caching strategy
6. Containerization using Docker for improved deployability