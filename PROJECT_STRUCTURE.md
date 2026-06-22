# CodeForge AI - Project Structure

```
codeforge-ai/
├── apps/
│   ├── frontend/                          # Next.js 15 Frontend
│   │   ├── src/
│   │   │   ├── app/                       # App router pages
│   │   │   │   ├── layout.tsx             # Root layout
│   │   │   │   ├── page.tsx               # Home page
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   ├── register/page.tsx
│   │   │   │   │   └── callback/page.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── problems/
│   │   │   │   │   │   ├── page.tsx       # Problems list
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   └── page.tsx   # Problem detail + IDE
│   │   │   │   │   │   └── [id]/solution/page.tsx
│   │   │   │   │   ├── submissions/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [id]/page.tsx
│   │   │   │   │   ├── contests/
│   │   │   │   │   │   ├── page.tsx       # Contests list
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   ├── page.tsx   # Contest detail
│   │   │   │   │   │   │   ├── problems/page.tsx
│   │   │   │   │   │   │   └── leaderboard/page.tsx
│   │   │   │   │   ├── interviews/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   │   └── [id]/page.tsx
│   │   │   │   │   ├── leaderboard/page.tsx
│   │   │   │   │   ├── reviews/page.tsx
│   │   │   │   │   ├── profile/page.tsx
│   │   │   │   │   ├── stats/page.tsx
│   │   │   │   │   └── learning-path/page.tsx
│   │   │   │   └── admin/
│   │   │   │       ├── layout.tsx
│   │   │   │       ├── problems/
│   │   │   │       ├── contests/
│   │   │   │       ├── users/
│   │   │   │       ├── analytics/
│   │   │   │       └── workers/page.tsx   # Monitor workers
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   └── RegisterForm.tsx
│   │   │   │   ├── ide/
│   │   │   │   │   ├── Editor.tsx         # Code editor with Ace/Monaco
│   │   │   │   │   ├── OutputPanel.tsx
│   │   │   │   │   ├── InputPanel.tsx
│   │   │   │   │   ├── TestCasesPanel.tsx
│   │   │   │   │   └── ExecutionControls.tsx
│   │   │   │   ├── contest/
│   │   │   │   │   ├── ContestCard.tsx
│   │   │   │   │   ├── LeaderboardTable.tsx
│   │   │   │   │   └── CountdownTimer.tsx
│   │   │   │   ├── problem/
│   │   │   │   │   ├── ProblemStatement.tsx
│   │   │   │   │   ├── ProblemTags.tsx
│   │   │   │   │   └── ProblemStats.tsx
│   │   │   │   ├── interview/
│   │   │   │   │   ├── InterviewPanel.tsx
│   │   │   │   │   ├── CodeReviewPanel.tsx
│   │   │   │   │   └── FeedbackPanel.tsx
│   │   │   │   ├── ui/                   # ShadCN components
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Dialog.tsx
│   │   │   │   │   ├── Tabs.tsx
│   │   │   │   │   └── ... (other shadcn components)
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── Footer.tsx
│   │   │   │   └── common/
│   │   │   │       ├── LoadingSpinner.tsx
│   │   │   │       ├── ErrorBoundary.tsx
│   │   │   │       └── Notification.tsx
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── api/
│   │   │   │   │   ├── client.ts          # Axios/Fetch client setup
│   │   │   │   │   ├── auth.ts
│   │   │   │   │   ├── problems.ts
│   │   │   │   │   ├── submissions.ts
│   │   │   │   │   ├── contests.ts
│   │   │   │   │   ├── reviews.ts
│   │   │   │   │   └── interviews.ts
│   │   │   │   ├── socket/
│   │   │   │   │   ├── client.ts          # Socket.IO client setup
│   │   │   │   │   └── events.ts          # Event type definitions
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useAuth.ts
│   │   │   │   │   ├── useSocket.ts
│   │   │   │   │   ├── useCodeEditor.ts
│   │   │   │   │   ├── useSubmission.ts
│   │   │   │   │   ├── useContest.ts
│   │   │   │   │   └── useLeaderboard.ts
│   │   │   │   ├── utils/
│   │   │   │   │   ├── auth.ts
│   │   │   │   │   ├── formatters.ts
│   │   │   │   │   ├── validators.ts
│   │   │   │   │   ├── constants.ts
│   │   │   │   │   └── helpers.ts
│   │   │   │   ├── context/
│   │   │   │   │   ├── AuthContext.tsx
│   │   │   │   │   └── ThemeContext.tsx
│   │   │   │   └── store/ (if using Zustand/Redux)
│   │   │   │       ├── authSlice.ts
│   │   │   │       ├── submissionSlice.ts
│   │   │   │       └── store.ts
│   │   │   │
│   │   │   ├── styles/
│   │   │   │   ├── globals.css
│   │   │   │   └── theme.css
│   │   │   │
│   │   │   └── types/
│   │   │       ├── index.ts               # Shared types from backend
│   │   │       ├── api.ts
│   │   │       ├── models.ts
│   │   │       └── socket.ts
│   │   │
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   └── .env.local.example
│   │
│   └── backend/                           # Express Backend
│       ├── src/
│       │   ├── config/
│       │   │   ├── env.ts                 # Environment variables
│       │   │   ├── database.ts            # Prisma setup
│       │   │   ├── redis.ts               # Redis client
│       │   │   ├── logger.ts              # Winston logger setup
│       │   │   └── constants.ts
│       │   │
│       │   ├── api/
│       │   │   ├── routes/
│       │   │   │   ├── auth.routes.ts
│       │   │   │   ├── problems.routes.ts
│       │   │   │   ├── submissions.routes.ts
│       │   │   │   ├── contests.routes.ts
│       │   │   │   ├── reviews.routes.ts
│       │   │   │   ├── interviews.routes.ts
│       │   │   │   ├── leaderboard.routes.ts
│       │   │   │   ├── recommendations.routes.ts
│       │   │   │   ├── users.routes.ts
│       │   │   │   └── admin.routes.ts
│       │   │   │
│       │   │   ├── controllers/
│       │   │   │   ├── AuthController.ts
│       │   │   │   ├── ProblemController.ts
│       │   │   │   ├── SubmissionController.ts
│       │   │   │   ├── ContestController.ts
│       │   │   │   ├── CodeReviewController.ts
│       │   │   │   ├── InterviewController.ts
│       │   │   │   ├── LeaderboardController.ts
│       │   │   │   ├── RecommendationController.ts
│       │   │   │   ├── UserController.ts
│       │   │   │   └── AdminController.ts
│       │   │   │
│       │   │   ├── middleware/
│       │   │   │   ├── auth.middleware.ts
│       │   │   │   ├── validation.middleware.ts
│       │   │   │   ├── error-handler.middleware.ts
│       │   │   │   ├── rate-limiter.middleware.ts
│       │   │   │   ├── logging.middleware.ts
│       │   │   │   └── cors.middleware.ts
│       │   │   │
│       │   │   └── validators/
│       │   │       ├── auth.validators.ts
│       │   │       ├── problem.validators.ts
│       │   │       ├── submission.validators.ts
│       │   │       └── contest.validators.ts
│       │   │
│       │   ├── services/
│       │   │   ├── AuthService.ts
│       │   │   ├── ProblemService.ts
│       │   │   ├── SubmissionService.ts  # Submission logic & queue
│       │   │   ├── ContestService.ts
│       │   │   ├── CodeReviewService.ts  # AI review integration
│       │   │   ├── InterviewService.ts
│       │   │   ├── LeaderboardService.ts
│       │   │   ├── RecommendationService.ts
│       │   │   ├── UserService.ts
│       │   │   ├── GoogleOAuthService.ts
│       │   │   ├── JudgeExecutionService.ts
│       │   │   ├── AnalyticsService.ts
│       │   │   └── WebSocketService.ts
│       │   │
│       │   ├── repositories/
│       │   │   ├── UserRepository.ts
│       │   │   ├── ProblemRepository.ts
│       │   │   ├── SubmissionRepository.ts
│       │   │   ├── ContestRepository.ts
│       │   │   ├── CodeReviewRepository.ts
│       │   │   ├── InterviewRepository.ts
│       │   │   ├── LeaderboardRepository.ts
│       │   │   ├── RecommendationRepository.ts
│       │   │   ├── TestCaseRepository.ts
│       │   │   └── BaseRepository.ts
│       │   │
│       │   ├── queue/
│       │   │   ├── Queue.ts               # Queue base class
│       │   │   ├── ExecutionQueue.ts      # Code execution jobs
│       │   │   ├── ReviewQueue.ts         # AI review jobs
│       │   │   ├── NotificationQueue.ts   # Email/notification jobs
│       │   │   ├── AnalyticsQueue.ts      # Analytics jobs
│       │   │   └── WorkerPool.ts          # Worker management
│       │   │
│       │   ├── socket/
│       │   │   ├── SocketManager.ts       # Socket.IO server setup
│       │   │   ├── namespaces/
│       │   │   │   ├── submission.namespace.ts
│       │   │   │   ├── contest.namespace.ts
│       │   │   │   ├── leaderboard.namespace.ts
│       │   │   │   ├── interview.namespace.ts
│       │   │   │   └── presence.namespace.ts
│       │   │   │
│       │   │   ├── handlers/
│       │   │   │   ├── SubmissionSocketHandler.ts
│       │   │   │   ├── ContestSocketHandler.ts
│       │   │   │   ├── LeaderboardSocketHandler.ts
│       │   │   │   └── PresenceSocketHandler.ts
│       │   │   │
│       │   │   └── events/
│       │   │       └── socketEvents.ts
│       │   │
│       │   ├── types/
│       │   │   ├── index.ts
│       │   │   ├── api.types.ts
│       │   │   ├── models.types.ts
│       │   │   ├── socket.types.ts
│       │   │   ├── queue.types.ts
│       │   │   └── judge.types.ts
│       │   │
│       │   ├── utils/
│       │   │   ├── jwt.ts
│       │   │   ├── bcrypt.ts
│       │   │   ├── validators.ts
│       │   │   ├── formatters.ts
│       │   │   ├── error-handler.ts
│       │   │   ├── logger.ts
│       │   │   ├── helpers.ts
│       │   │   └── constants.ts
│       │   │
│       │   ├── integrations/
│       │   │   ├── ai/
│       │   │   │   ├── OpenAIClient.ts
│       │   │   │   ├── ClaudeClient.ts
│       │   │   │   └── codeAnalyzer.ts
│       │   │   ├── judge/
│       │   │   │   ├── DockerExecutor.ts
│       │   │   │   ├── CodeCompiler.ts
│       │   │   │   └── SandboxManager.ts
│       │   │   ├── email/
│       │   │   │   └── EmailService.ts
│       │   │   ├── storage/
│       │   │   │   └── S3Client.ts
│       │   │   └── payment/
│       │   │       └── StripeClient.ts
│       │   │
│       │   ├── jobs/
│       │   │   ├── ExecutionJob.ts
│       │   │   ├── ReviewJob.ts
│       │   │   ├── NotificationJob.ts
│       │   │   ├── AnalyticsJob.ts
│       │   │   └── RecommendationJob.ts
│       │   │
│       │   ├── workers/
│       │   │   ├── JudgeWorker.ts
│       │   │   ├── ReviewWorker.ts
│       │   │   └── BatchWorker.ts
│       │   │
│       │   ├── app.ts                    # Express app setup
│       │   └── server.ts                 # Server entry point
│       │
│       ├── prisma/
│       │   ├── schema.prisma             # Database schema
│       │   ├── migrations/               # Database migrations
│       │   │   ├── migration_lock.toml
│       │   │   └── [timestamp]_init/migration.sql
│       │   └── seed.ts                   # Seed data for development
│       │
│       ├── docker/
│       │   ├── Dockerfile
│       │   ├── Dockerfile.worker
│       │   └── docker-compose.yml
│       │
│       ├── tests/
│       │   ├── unit/
│       │   │   ├── services/
│       │   │   └── utils/
│       │   ├── integration/
│       │   │   ├── api/
│       │   │   └── database/
│       │   └── e2e/
│       │       └── submission.e2e.ts
│       │
│       ├── scripts/
│       │   ├── seed.ts
│       │   ├── migrate.ts
│       │   └── setup.ts
│       │
│       ├── package.json
│       ├── tsconfig.json
│       ├── .env.example
│       └── jest.config.js
│
├── packages/
│   ├── shared/                           # Shared types & utilities
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   ├── models.ts
│   │   │   │   ├── api.ts
│   │   │   │   └── socket.ts
│   │   │   ├── utils/
│   │   │   │   ├── constants.ts
│   │   │   │   ├── validators.ts
│   │   │   │   └── formatters.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── judge-sdk/                        # Judge SDK for workers
│       ├── src/
│       │   ├── executor.ts
│       │   ├── compiler.ts
│       │   ├── sandbox.ts
│       │   └── types.ts
│       ├── package.json
│       └── tsconfig.json
│
├── infrastructure/                        # IaC & DevOps
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── rds.tf
│   │   ├── ecs.tf
│   │   ├── elasticache.tf
│   │   └── networking.tf
│   ├── kubernetes/
│   │   ├── backend-deployment.yaml
│   │   ├── frontend-deployment.yaml
│   │   ├── worker-deployment.yaml
│   │   ├── postgres-statefulset.yaml
│   │   ├── redis-statefulset.yaml
│   │   └── ingress.yaml
│   └── docker-compose.yml                # Local development
│
├── docs/
│   ├── ARCHITECTURE.md                   # Architecture document
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_SCHEMA.md
│   ├── DEVELOPMENT_GUIDE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── WEBSOCKET_EVENTS.md
│   ├── SECURITY.md
│   ├── MONITORING.md
│   └── DIAGRAMS.md
│
├── .github/
│   ├── workflows/
│   │   ├── test.yml
│   │   ├── build.yml
│   │   ├── deploy.yml
│   │   └── lint.yml
│   └── PULL_REQUEST_TEMPLATE.md
│
├── scripts/
│   ├── setup.sh
│   ├── dev.sh
│   ├── build.sh
│   ├── test.sh
│   └── deploy.sh
│
├── docker-compose.yml                    # Main compose file
├── README.md
├── ARCHITECTURE.md
├── SECURITY.md
├── .gitignore
├── tsconfig.json                         # Monorepo root tsconfig
└── package.json                          # Monorepo root package.json
```

## Key Directory Explanations

### apps/
Monorepo pattern with separate frontend and backend applications. Each has its own:
- package.json
- tsconfig.json
- build configuration
- environment setup

### packages/
Shared code across frontend and backend:
- **shared**: Common types, constants, and utilities
- **judge-sdk**: Reusable judge execution library

### infrastructure/
Infrastructure-as-Code for cloud deployment:
- Terraform for AWS resources
- Kubernetes manifests for Kubernetes deployments
- Docker Compose for local development

### docs/
Comprehensive documentation split into logical pieces to avoid single monolithic files.

## Architecture Patterns Used

1. **Repository Pattern**: Data access abstraction layer
2. **Service Layer**: Business logic encapsulation
3. **Dependency Injection**: Loose coupling between components
4. **Factory Pattern**: Complex object creation
5. **Observer Pattern**: Socket.IO event handling
6. **Pub/Sub**: Message queue for async operations
7. **Clean Architecture**: Clear separation of concerns

