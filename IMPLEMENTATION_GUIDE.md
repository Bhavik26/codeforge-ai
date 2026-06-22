# CodeForge AI - Implementation Guide

## Overview

CodeForge AI is a production-grade competitive programming platform designed to handle 100,000+ concurrent users. This guide covers the complete project structure, setup, and implementation details.

---

## 📋 What Has Been Created

### Documentation Files
1. **ARCHITECTURE.md** - Comprehensive system architecture including:
   - High-level architecture diagram
   - Database schema with ER diagram
   - API endpoints design
   - WebSocket events
   - Message queue architecture
   - Docker worker architecture
   - Security architecture
   - Deployment architecture

2. **PROJECT_STRUCTURE.md** - Complete folder structure with explanations

3. **DEVELOPMENT_ROADMAP.md** - 12-week implementation plan with:
   - Phase-by-phase breakdown
   - Success metrics
   - Risk mitigation
   - Effort estimation

### Backend Implementation (Partially Complete)

#### Configuration Layer
- ✅ **env.ts** - Environment variable management
- ✅ **database.ts** - Prisma ORM setup with logging
- ✅ **redis.ts** - Redis client configuration
- ✅ **logger.ts** - Winston logger setup with file rotation

#### Core Application
- ✅ **app.ts** - Express app initialization with middleware
- ✅ **server.ts** - HTTP server entry point with graceful shutdown
- ✅ **Socket.IO setup** - WebSocket server configuration

#### Middleware
- ✅ **error-handler.middleware.ts** - Global error handling
- ✅ **auth.middleware.ts** - JWT authentication
- ✅ **rate-limiter.middleware.ts** - Rate limiting with Redis
- ✅ **logging.middleware.ts** - Request/response logging
- ✅ **validation.middleware.ts** - Stub for validation
- ✅ **cors.middleware.ts** - CORS configuration

#### Database & Repositories
- ✅ **schema.prisma** - Complete database schema with:
  - User & Authentication models
  - Problem management models
  - Submission & execution models
  - Contest models
  - Code review models
  - Interview models
  - Recommendation models
  - System audit models
- ✅ **BaseRepository.ts** - Abstract repository pattern
- ✅ **UserRepository.ts** - User data access layer

#### Services & Controllers
- ✅ **AuthController.ts** - Authentication logic:
  - User registration with validation
  - Email/password login
  - JWT token generation and refresh
  - Profile management
  - Google OAuth placeholder
- ✅ **SocketManager.ts** - WebSocket management with:
  - User presence tracking
  - Submission namespace
  - Contest namespace
  - Leaderboard namespace
  - Interview namespace
  - Real-time event emission

#### Queue System
- ✅ **Queue.ts** - BullMQ queue base class with:
  - Job addition and processing
  - Retry logic with exponential backoff
  - Queue statistics
  - Worker initialization
  - Event listeners

#### API Routes
- ✅ **auth.routes.ts** - Authentication endpoints (IMPLEMENTED)
- ✅ **problems.routes.ts** - Problem endpoints (PLACEHOLDER)
- ✅ **submissions.routes.ts** - Submission endpoints (PLACEHOLDER)
- ✅ **contests.routes.ts** - Contest endpoints (PLACEHOLDER)
- ✅ **reviews.routes.ts** - Code review endpoints (PLACEHOLDER)
- ✅ **interviews.routes.ts** - Interview endpoints (PLACEHOLDER)
- ✅ **leaderboard.routes.ts** - Leaderboard endpoints (PLACEHOLDER)
- ✅ **recommendations.routes.ts** - Recommendation endpoints (PLACEHOLDER)
- ✅ **users.routes.ts** - User endpoints (PLACEHOLDER)
- ✅ **admin.routes.ts** - Admin endpoints (PLACEHOLDER)

#### Utilities
- ✅ **jwt.ts** - JWT token generation and verification

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (use v20 recommended)
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose
- Git

### Local Development Setup

#### 1. Clone and Install Dependencies
```bash
# Clone repository
git clone <repo-url>
cd codeforge-ai

# Install root dependencies
npm install

# Install workspace dependencies
npm install -w apps/backend
npm install -w apps/frontend
npm install -w packages/shared
```

#### 2. Environment Setup
```bash
# Copy environment template
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local

# Update .env with your values:
# DATABASE_URL=postgresql://user:password@localhost:5432/codeforge_dev
# REDIS_HOST=localhost
# REDIS_PORT=6379
# JWT_ACCESS_TOKEN_SECRET=your-secret-key
# JWT_REFRESH_TOKEN_SECRET=your-refresh-secret
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### 3. Database Setup
```bash
# Create PostgreSQL database
createdb codeforge_dev

# Run migrations
cd apps/backend
npx prisma migrate dev --name init

# Seed database (optional)
npm run seed
```

#### 4. Start Development Environment
```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Or start services manually
# Terminal 1 - Backend
cd apps/backend
npm run dev

# Terminal 2 - Frontend
cd apps/frontend
npm run dev

# Terminal 3 - Worker (optional)
cd apps/backend
npm run worker
```

#### 5. Verify Setup
```bash
# Check backend
curl http://localhost:3001/health

# Frontend should be available at
# http://localhost:3000
```

---

## 📁 Project Structure Overview

```
codeforge-ai/
├── apps/
│   ├── backend/          # Express.js backend
│   │   ├── src/
│   │   │   ├── api/      # Routes, controllers, middleware
│   │   │   ├── config/   # Configuration files
│   │   │   ├── queue/    # Message queue system
│   │   │   ├── socket/   # WebSocket handlers
│   │   │   ├── services/ # Business logic
│   │   │   ├── repositories/  # Data access
│   │   │   ├── utils/    # Utilities
│   │   │   ├── workers/  # Background workers
│   │   │   ├── app.ts    # Express app
│   │   │   └── server.ts # Entry point
│   │   ├── prisma/       # Database schema & migrations
│   │   └── docker/       # Docker configuration
│   │
│   └── frontend/         # Next.js frontend
│       ├── src/
│       │   ├── app/      # Pages
│       │   ├── components/ # React components
│       │   ├── lib/      # Utilities and hooks
│       │   ├── types/    # TypeScript types
│       │   └── styles/   # CSS files
│       └── public/       # Static assets
│
├── packages/
│   ├── shared/          # Shared types and utilities
│   └── judge-sdk/       # Judge execution SDK
│
├── infrastructure/      # IaC and DevOps
│   ├── terraform/       # AWS infrastructure
│   ├── kubernetes/      # K8s manifests
│   └── docker-compose.yml
│
├── docs/               # Documentation
├── ARCHITECTURE.md     # Architecture document
├── DEVELOPMENT_ROADMAP.md
└── README.md
```

---

## 🔄 Development Workflow

### Adding a New Feature

1. **Create a new branch**
   ```bash
   git checkout -b feature/problem-management
   ```

2. **Implement the feature following the pattern**
   - Create models in Prisma schema
   - Create repository for data access
   - Create service for business logic
   - Create controller for API handling
   - Create routes
   - Implement WebSocket events if needed
   - Add tests

3. **Follow the Architecture**
   ```
   Route → Controller → Service → Repository → Database
                           ↓
                       Queue (if async)
   ```

4. **Example: Adding Problem Management**

   **a) Update Prisma schema (already done)**
   ```prisma
   model Problem {
     id String @id @default(cuid())
     title String
     // ... fields
   }
   ```

   **b) Create ProblemRepository**
   ```typescript
   export class ProblemRepository extends BaseRepository<Problem> {
     // Data access methods
   }
   ```

   **c) Create ProblemService**
   ```typescript
   export class ProblemService {
     private problemRepository: ProblemRepository;
     // Business logic
   }
   ```

   **d) Create ProblemController**
   ```typescript
   export class ProblemController {
     async listProblems(req, res) {
       // Handle requests
     }
   }
   ```

   **e) Create Routes**
   ```typescript
   router.get('/', controller.listProblems);
   ```

---

## 🔐 Authentication Flow

### JWT-Based Authentication

1. **Registration**
   ```
   POST /api/v1/auth/register
   Body: { email, username, password, firstName, lastName }
   Response: { user, tokens: { accessToken, refreshToken } }
   ```

2. **Login**
   ```
   POST /api/v1/auth/login
   Body: { email, password }
   Response: { user, tokens: { accessToken, refreshToken } }
   ```

3. **Using Token**
   ```
   Header: Authorization: Bearer <accessToken>
   ```

4. **Refresh Token**
   ```
   POST /api/v1/auth/refresh
   Body: { refreshToken }
   Response: { accessToken }
   ```

---

## 🔌 WebSocket Events

### Connection
```typescript
const socket = io('http://localhost:3001', {
  auth: { token: accessToken }
});
```

### Submitting Code
```javascript
// Subscribe to submission updates
socket.emit('submission:subscribe', { submissionId });

// Listen for updates
socket.on('submission:progress', (data) => {
  console.log('Progress:', data);
});

socket.on('submission:completed', (result) => {
  console.log('Result:', result);
});
```

### Contest Events
```javascript
socket.emit('contest:subscribe', { contestId });
socket.on('contest:ended', (data) => { /* ... */ });
socket.on('leaderboard:update', (data) => { /* ... */ });
```

---

## 📊 Database Schema Highlights

### User Model
```prisma
- Authentication: email, username, passwordHash, googleId
- Profile: firstName, lastName, avatarUrl, bio
- Statistics: rating, totalSubmissions, acceptedSubmissions
- Account: isEmailVerified, isBanned
```

### Problem Model
```prisma
- Content: title, description, editorial
- Constraints: difficulty, timeLimit, memoryLimit
- Test Cases: multiple TestCase relations
- Statistics: totalSubmissions, acceptedCount, successRate
```

### Submission Model
```prisma
- Code: code, language
- Status: status (PENDING, COMPILING, EXECUTING, COMPLETED)
- Verdict: verdict (ACCEPTED, WRONG_ANSWER, TIME_LIMIT_EXCEEDED, etc.)
- Results: multiple SubmissionResult relations
- Performance: executionTime, memoryUsed, score
```

### Contest Model
```prisma
- Timing: startTime, endTime, registrationStart, registrationEnd
- Configuration: status, maxParticipants, scoringType
- Relations: problems, participants, submissions, leaderboard
```

---

## 🎯 Next Steps to Complete

### Phase 1 Complete ✅
- [x] Project setup
- [x] Database schema
- [x] Authentication system
- [x] Core infrastructure

### Phase 2 Next (Weeks 3-5)
- [ ] Problem CRUD APIs
- [ ] Problem listing with filters
- [ ] Code submission endpoint
- [ ] Code execution in Docker
- [ ] Test case validation
- [ ] Submission result storage
- [ ] Frontend IDE component

### Quick Start: Implementing Problem APIs

**1. Create ProblemRepository** (extends BaseRepository)
```typescript
export class ProblemRepository extends BaseRepository<Problem> {
  constructor() {
    super(prisma.problem);
  }

  async findByDifficulty(difficulty: Difficulty) {
    return this.model.findMany({
      where: { difficulty, isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

**2. Create ProblemService**
```typescript
export class ProblemService {
  private problemRepository: ProblemRepository;

  async getProblems(filters, pagination) {
    // Business logic
  }
}
```

**3. Create ProblemController**
```typescript
export class ProblemController {
  async listProblems(req, res) {
    const problems = await this.service.getProblems(...);
    res.json(problems);
  }
}
```

**4. Add Routes**
```typescript
router.get('/', controller.listProblems);
router.get('/:id', controller.getProblem);
router.post('/', authMiddleware, controller.createProblem);
```

---

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

---

## 📈 Performance Optimization

### Caching Strategy
- **User Sessions**: Redis (24h TTL)
- **Problem Data**: Redis (1h TTL)
- **Leaderboard**: Redis (30s TTL)
- **Contest Data**: Redis (5m TTL)

### Database Optimization
- Index frequently queried fields
- Use Prisma select to fetch only needed fields
- Implement pagination for large result sets
- Use connection pooling

### API Performance Targets
- Response time: < 200ms (p95)
- Cache hit rate: > 80%
- Database query: < 50ms (p95)

---

## 🔧 Common Commands

### Development
```bash
npm run dev          # Start all services
npm run dev:backend  # Backend only
npm run dev:frontend # Frontend only
npm run seed         # Seed database
```

### Database
```bash
npx prisma migrate dev   # Run migrations
npx prisma studio       # Visual database explorer
npx prisma generate     # Generate Prisma client
```

### Docker
```bash
docker-compose up -d        # Start services
docker-compose down         # Stop services
docker-compose logs -f      # View logs
```

### Deployment
```bash
npm run build        # Build application
npm run start        # Start production server
npm run deploy       # Deploy to production
```

---

## 📞 Support & Documentation

### Key Documentation Files
- `ARCHITECTURE.md` - System design
- `DEVELOPMENT_ROADMAP.md` - Implementation plan
- `docs/API_DOCUMENTATION.md` - API endpoints
- `docs/DATABASE_SCHEMA.md` - Database details
- `docs/WEBSOCKET_EVENTS.md` - WebSocket protocol
- `docs/DEPLOYMENT_GUIDE.md` - Deployment steps
- `docs/SECURITY.md` - Security considerations

### Common Issues

**Database Connection Failed**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists

**Redis Connection Failed**
- Ensure Redis is running
- Check REDIS_HOST and REDIS_PORT
- Run `redis-cli ping`

**Port Already in Use**
- Change SERVER_PORT in .env
- Or kill process: `lsof -i :3001`

---

## 🎓 Interview Questions Reference

### Based on CodeForge Architecture
1. How would you scale from 1K to 100K concurrent users?
2. Design the database schema for competitive programming
3. How would you implement real-time leaderboards?
4. Design distributed code execution system
5. Implement rate limiting for API endpoints
6. Design code submission queue architecture
7. How would you prevent code injection?
8. Design caching strategy for hot data

---

## 📝 Development Standards

### Code Style
- Use TypeScript for type safety
- Follow Google TypeScript style guide
- Use ESLint and Prettier
- Name files as: `FileName.ts` (PascalCase)

### Git Workflow
- Create feature branches: `feature/feature-name`
- Write descriptive commit messages
- Squash commits before merging
- Require PR review before merge

### Documentation
- Document public APIs with JSDoc
- Update README for major changes
- Keep CHANGELOG updated
- Add comments for non-obvious logic

---

## 🚢 Deployment Checklist

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Docker images built and tested
- [ ] Load testing completed
- [ ] Monitoring configured
- [ ] Backup procedures in place
- [ ] Rollback plan documented

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com)
- [Prisma ORM Guide](https://www.prisma.io/docs)
- [Socket.IO Documentation](https://socket.io/docs)
- [BullMQ Queue Guide](https://docs.bullmq.io)
- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Guide](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

## 📞 Getting Help

For issues or questions:
1. Check existing documentation
2. Search GitHub issues
3. Check Stack Overflow tags: `#codeforgeai`
4. Create detailed GitHub issue with reproduction steps

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Phase 1 Complete, Phase 2 Ready to Start

