# TeleFind - Telegram Channel Discovery Platform

## Overview

TeleFind is a minimal web application for discovering and reviewing Telegram channels. Built with a full-stack TypeScript architecture, it features a React frontend with glassmorphism design, Express backend, and PostgreSQL database. The application allows users to browse channels, submit reviews, and includes an admin panel for content moderation.

**Key Features:**
- Minimal interface with only search, add channel, and admin login buttons
- Anonymous channel posting and reviews
- Dark theme with glassmorphism effects
- Admin panel for content moderation
- Tag-based channel categorization

## User Preferences

- Preferred communication style: Simple, everyday language
- Interface: Minimal design with only essential elements
- No authentication required for regular users
- Anonymous posting capability

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom glassmorphism design and dark theme
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Express sessions with PostgreSQL session store
- **Password Hashing**: bcrypt for admin authentication
- **API Design**: RESTful endpoints with JSON responses

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Located in `shared/schema.ts` for type safety across frontend/backend
- **Migration**: Drizzle Kit for database migrations
- **Connection**: Neon serverless PostgreSQL with connection pooling

## Key Components

### Database Schema
- **channels**: Core channel information with approval status
- **tags**: Categorization system with color coding
- **channelTags**: Many-to-many relationship between channels and tags
- **reviews**: User reviews with ratings and approval system
- **tagSuggestions**: User-submitted tag suggestions
- **adminUsers**: Admin authentication
- **sessions**: Session storage for authentication

### API Endpoints
- **Channel Management**: CRUD operations for channels with search and filtering
- **Review System**: Channel reviews with moderation capabilities
- **Tag System**: Dynamic tagging with user suggestions
- **Admin Panel**: Authentication and content moderation tools

### UI Components
- **Glassmorphism Design**: Custom component with backdrop blur effects
- **Responsive Layout**: Mobile-first design with adaptive components
- **Modal System**: Channel details, add channel, and settings modals
- **Admin Dashboard**: Comprehensive management interface

## Data Flow

1. **User Interaction**: Users browse channels through search and tag filtering
2. **API Communication**: Frontend communicates with backend via REST endpoints
3. **Database Operations**: Drizzle ORM handles database queries and transactions
4. **State Management**: TanStack Query manages API state and caching
5. **Real-time Updates**: Optimistic updates with query invalidation

## External Dependencies

### Frontend Dependencies
- **@radix-ui/***: Comprehensive UI component library
- **@tanstack/react-query**: Server state management
- **@hookform/resolvers**: Form validation integration
- **wouter**: Lightweight routing
- **class-variance-authority**: Component variant management
- **tailwindcss**: Utility-first CSS framework

### Backend Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Type-safe database ORM
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store
- **bcrypt**: Password hashing
- **zod**: Schema validation

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution
- **esbuild**: Backend bundling
- **drizzle-kit**: Database migration tool

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations ensure schema consistency

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Session encryption key
- **NODE_ENV**: Environment flag (development/production)

### Development Workflow
- **dev**: Runs development server with hot reload
- **build**: Creates production builds for both frontend and backend
- **start**: Runs production server
- **db:push**: Pushes database schema changes

### Production Considerations
- Session storage in PostgreSQL for scalability
- Secure cookie settings based on environment
- Static file serving for built frontend assets
- Error handling and logging middleware