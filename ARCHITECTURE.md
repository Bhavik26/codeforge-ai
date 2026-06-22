# CodeForge AI - Production Architecture Document

## Executive Summary
CodeForge AI is a comprehensive competitive programming platform designed to handle 100,000+ concurrent users. It combines distributed code execution, AI-powered code review, mock interviews, and personalized learning recommendations.

---

## 1. System Architecture Overview

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND TIER                            │
│  Next.js 15 (React) + TypeScript + TailwindCSS + ShadCN UI      │
│  - Web App (competitions, submissions, contests)                 │
│  - IDE with real-time code execution                            │
│  - Live leaderboards with WebSocket                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌───▼────┐      ┌─────▼─────┐      ┌────▼──────┐
    │  REST  │      │ WebSocket │      │  GraphQL  │
    │  APIs  │      │   Events  │      │ (Optional)│
    └───┬────┘      └─────┬─────┘      └────┬──────┘
        │                  │                  │
└───────┴──────────────────┼──────────────────┴────────────┐
                           │                               │
        ┌──────────────────┴───────────────┐               │
        │                                  │               │
┌───────▼────────────────────────────────┐│               │
│      BACKEND APPLICATION TIER          ││               │
│  Express.js + Node.js + TypeScript      ││               │
│                                         ││               │
│  ┌────────────────────────────────┐    ││               │
│  │ API Routes & Controllers       │    ││               │
│  │ - Auth Service                 │    ││               │
│  │ - Problem Management           │    ││               │
│  │ - Contest Management           │    ││               │
│  │ - Submission Handler           │    ││               │
│  │ - Leaderboard Service          │    ││               │
│  │ - AI Review Service            │    ││               │
│  │ - Interview Service            │    ││               │
│  │ - Recommendation Engine        │    ││               │
│  └────────────────────────────────┘    ││               │
│                                         ││               │
│  ┌────────────────────────────────┐    ││               │
│  │ Real-Time Engine               │    ││               │
│  │ - Socket.IO Server             │    ││               │
│  │ - Room Management              │    ││               │
│  │ - Presence Service             │    ││               │
│  └────────────────────────────────┘    ││               │
│                                         ││               │
│  ┌────────────────────────────────┐    ││               │
│  │ Message Queue Integration      │    ││               │
│  │ - BullMQ Task Producer         │    ││               │
│  │ - Event Publishing             │    ││               │
│  └────────────────────────────────┘    ││               │
└─────────────────────┬────────────────────┘│               │
                      │                     │               │
         ┌────────────┼─────────────┐       │               │
         │            │             │       │               │
    ┌────▼──┐  ┌──────▼──────┐  ┌──▼───┐   │               │
    │Redis  │  │ PostgreSQL  │  │Cache │   │               │
    │Cluster│  │   Primary   │  │Layer │   │               │
    └────┬──┘  └──────┬──────┘  └──┬───┘   │               │
         │            │            │       │               │
         └────────────┼────────────┘       │               │
                      │                     │               │
         ┌────────────▼──────────────┐     │               │
         │  MESSAGE QUEUE TIER       │     │               │
         │  BullMQ + Redis           │     │               │
         │                           │     │               │
         │  ┌─────────────────────┐  │     │               │
         │  │ Queues              │  │     │               │
         │  │ - Code Execution    │  │     │               │
         │  │ - AI Reviews        │  │     │               │
         │  │ - Email Notifications
         │  │ - Report Generation │  │     │               │
         │  └─────────────────────┘  │     │               │
         └────────────┬──────────────┘     │               │
                      │                     │               │
         ┌────────────▼──────────────┐     │               │
         │ WORKER TIER               │     │               │
         │ Docker Container Workers   │     │               │
         │                           │     │               │
         │ ┌─────────────────────┐   │     │               │
         │ │ Judge Workers (10+) │   │     │               │
         │ │ - Code Compilation  │   │     │               │
         │ │ - Test Execution    │   │     │               │
         │ │ - Output Validation │   │     │               │
         │ └─────────────────────┘   │     │               │
         │                           │     │               │
         │ ┌─────────────────────┐   │     │               │
         │ │ AI Workers (5+)     │   │     │               │
         │ │ - Code Analysis     │   │     │               │
         │ │ - ML Models         │   │     │               │
         │ │ - Review Generation │   │     │               │
         │ └─────────────────────┘   │     │               │
         │                           │     │               │
         │ ┌─────────────────────┐   │     │               │
         │ │ Batch Workers (3+)  │   │     │               │
         │ │ - Report Generation │   │     │               │
         │ │ - Recommendations   │   │     │               │
         │ │ - Analytics         │   │     │               │
         │ └─────────────────────┘   │     │               │
         └───────────┬────────────────┘     │               │
                     │                      │               │
         ┌───────────▼──────────────┐       │               │
         │ EXTERNAL SERVICES        │       │               │
         │ - OpenAI/Claude (AI)     │       │               │
         │ - SendGrid (Email)       │       │               │
         │ - Stripe (Payments)      │       │               │
         │ - S3 (File Storage)      │       │               │
         │ - DataDog (Monitoring)   │       │               │
         └──────────────────────────┘       │               │
                                           │               │
                       └───────────────────┴───────────────┘
                                        │
                         ┌──────────────▼──────────────┐
                         │ MESSAGE BUS (Optional)      │
                         │ - Kafka/RabbitMQ            │
                         │ - Cross-Region Sync         │
                         │ - Event Streaming           │
                         └─────────────────────────────┘
```

---

## 2. Database Schema (PostgreSQL + Prisma)

### Entity Relationship Diagram
```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│     USERS        │         │   PROBLEMS       │         │    CONTESTS      │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ id (PK)          │         │ id (PK)          │
│ email            │────┐    │ title            │    ┌────│ title            │
│ username         │    │    │ description      │    │    │ start_time       │
│ password_hash    │    │    │ difficulty       │    │    │ end_time         │
│ first_name       │    │    │ tags             │    │    │ max_participants │
│ last_name        │    │    │ time_limit       │    │    │ status           │
│ avatar_url       │    │    │ memory_limit     │    │    │ created_at       │
│ bio              │    │    │ test_cases       │    │    │ updated_at       │
│ rating           │    │    │ editorial        │    │    └──────────────────┘
│ total_submissions│    │    │ created_at       │         │
│ solved_count     │    │    │ updated_at       │         │
│ created_at       │    │    └──────────────────┘         │
│ updated_at       │    │            │                    │
└──────────────────┘    │            │ 1:N               │
        │               │            │                    │
        │ 1:N           │    ┌───────▼──────────────┐     │
        │               │    │   SUBMISSIONS       │     │
        │               │    ├─────────────────────┤     │
        │               │    │ id (PK)             │     │
        │               │    │ user_id (FK)        │     │
        │               └────│ problem_id (FK)     │◄────┤
        │                    │ code                │     │
        │                    │ language            │     │
        │                    │ status              │     │
        │                    │ verdict             │     │
        │                    │ exec_time           │     │
        │                    │ memory_used         │     │
        │                    │ compilation_error   │     │
        │                    │ runtime_error       │     │
        │                    │ score               │     │
        │                    │ submitted_at        │     │
        │                    └──────┬──────────────┘     │
        │                           │                    │
        │                           │ 1:N               │
        │                    ┌──────▼──────────────┐     │
        │                    │ SUBMISSION_RESULTS  │     │
        │                    ├─────────────────────┤     │
        │                    │ id (PK)             │     │
        │                    │ submission_id (FK)  │     │
        │                    │ test_case_id        │     │
        │                    │ status              │     │
        │                    │ expected_output     │     │
        │                    │ actual_output       │     │
        │                    └─────────────────────┘     │
        │                                                 │
        │                  ┌──────────────────────┐      │
        │                  │ CONTEST_PROBLEMS    │      │
        │                  ├──────────────────────┤      │
        │                  │ id (PK)              │      │
        │                  │ contest_id (FK)─────┼──────┤
        │                  │ problem_id (FK)─────┼──────┘
        │                  │ points               │
        │                  │ order                │
        │                  └──────────────────────┘
        │                           │
        │                           │ 1:N
        │                  ┌────────▼─────────────┐
        │                  │ CONTEST_SUBMISSIONS │
        │                  ├─────────────────────┤
        │                  │ id (PK)             │
        │                  │ contest_id (FK)     │
        │                  │ user_id (FK)────────┼────────┐
        │                  │ submission_id (FK)  │        │
        │                  │ points              │        │
        │                  │ submitted_at        │        │
        │                  └─────────────────────┘        │
        │                                                  │
        │          ┌───────────────────────────────────────┼───┐
        │          │                                       │   │
        ├─ 1:N ────┤    ┌──────────────────────────┐      │   │
        │          │    │ LEADERBOARD             │      │   │
        │          │    ├──────────────────────────┤      │   │
        │          │    │ id (PK)                 │      │   │
        │          │    │ contest_id (FK)         │      │   │
        │          └────│ user_id (FK)────────────┼──────┘   │
        │               │ rank                    │          │
        │               │ score                   │          │
        │               │ time_taken              │          │
        │               │ last_submission_time    │          │
        │               │ solved_count            │          │
        │               └──────────────────────────┘          │
        │                                                      │
        │          ┌────────────────────────────────────────┐ │
        │          │ CODE_REVIEWS                           │ │
        │          ├────────────────────────────────────────┤ │
        │          │ id (PK)                                │ │
        │          │ submission_id (FK)                     │ │
        │          │ reviewer_type (AI/HUMAN)               │ │
        │          │ score                                  │ │
        │          │ feedback                               │ │
        │          │ improvement_suggestions                │ │
        │          │ complexity_analysis                    │ │
        │          │ readability_score                      │ │
        │          │ efficiency_score                       │ │
        │          │ created_at                             │ │
        │          └──────────────────────────────────────┬─┘ │
        │                                                  │   │
        │          ┌───────────────────────────────────────┘   │
        │          │                                            │
        │    ┌─────▼──────────────────────────────┐             │
        │    │ MOCK_INTERVIEWS                    │             │
        │    ├────────────────────────────────────┤             │
        │    │ id (PK)                            │             │
        │    │ user_id (FK)───────────────────────┼─────────────┤
        │    │ problem_id (FK)────────────────────┼─────────────┘
        │    │ difficulty_level                   │
        │    │ duration (minutes)                 │
        │    │ feedback                           │
        │    │ score                              │
        │    │ started_at                         │
        │    │ completed_at                       │
        │    └────────────────────────────────────┘
        │
        │    ┌────────────────────────────────────┐
        │    │ USER_RECOMMENDATIONS               │
        │    ├────────────────────────────────────┤
        │    │ id (PK)                            │
        │    │ user_id (FK)───────────────────────┤
        │    │ problem_id (FK)                    │
        │    │ reason                             │
        │    │ similarity_score                   │
        │    │ predicted_difficulty               │
        │    │ created_at                         │
        │    └────────────────────────────────────┘
        │
        │    ┌────────────────────────────────────┐
        │    │ USER_STATS & ANALYTICS             │
        │    ├────────────────────────────────────┤
        │    │ id (PK)                            │
        │    │ user_id (FK)───────────────────────┤
        │    │ total_submissions                  │
        │    │ accepted_submissions               │
        │    │ contests_participated              │
        │    │ avg_score                          │
        │    │ rating_history                     │
        │    │ last_active                        │
        │    │ updated_at                         │
        │    └────────────────────────────────────┘
```

---

## 3. API Endpoints Architecture

### Authentication APIs
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/logout            - Logout user
POST   /api/auth/refresh           - Refresh JWT token
POST   /api/auth/google/callback   - Google OAuth callback
GET    /api/auth/profile           - Get current user profile
PUT    /api/auth/profile           - Update user profile
```

### Problem APIs
```
GET    /api/problems               - List all problems (paginated, filtered)
GET    /api/problems/:id           - Get problem details
POST   /api/problems               - Create problem (admin)
PUT    /api/problems/:id           - Update problem (admin)
DELETE /api/problems/:id           - Delete problem (admin)
GET    /api/problems/:id/testcases - Get test cases for problem
```

### Submission APIs
```
POST   /api/submissions            - Submit code for execution
GET    /api/submissions/:id        - Get submission details
GET    /api/submissions            - List user's submissions (paginated)
GET    /api/submissions/:id/result - Get submission execution result
```

### Contest APIs
```
GET    /api/contests               - List all contests
GET    /api/contests/:id           - Get contest details
POST   /api/contests               - Create contest (admin)
PUT    /api/contests/:id           - Update contest (admin)
DELETE /api/contests/:id           - Delete contest (admin)
POST   /api/contests/:id/register  - Register for contest
GET    /api/contests/:id/leaderboard - Get contest leaderboard
POST   /api/contests/:id/submit    - Submit in contest
```

### Code Review APIs
```
POST   /api/reviews                - Request AI code review
GET    /api/reviews/:id            - Get review details
GET    /api/reviews                - List reviews for user
```

### Mock Interview APIs
```
POST   /api/interviews             - Start mock interview
GET    /api/interviews/:id         - Get interview details
PUT    /api/interviews/:id/end     - End interview session
POST   /api/interviews/:id/answer  - Submit answer
GET    /api/interviews/:id/feedback - Get interview feedback
```

### Leaderboard APIs
```
GET    /api/leaderboards/global    - Global leaderboard
GET    /api/leaderboards/contests/:id - Contest leaderboard
GET    /api/users/:id/stats        - User statistics
```

### Recommendation APIs
```
GET    /api/recommendations        - Get personalized recommendations
GET    /api/recommendations/learning-path - Get learning path
```

---

## 4. WebSocket Events (Socket.IO)

### Connection Management
```
connect                    - Client connects to socket server
disconnect                 - Client disconnects
reconnect                  - Client reconnects
```

### Code Execution Events
```
submission:start           - Submission starts executing
submission:progress        - Submission progress update
submission:completed       - Submission completed
submission:error           - Submission execution error
test_case:result           - Individual test case result
```

### Leaderboard Events
```
leaderboard:update         - Leaderboard updated
leaderboard:rank_change    - User's rank changed
leaderboard:subscribe      - Subscribe to leaderboard updates
leaderboard:unsubscribe    - Unsubscribe from leaderboard
```

### Contest Events
```
contest:started            - Contest started
contest:ending_soon        - Contest ending soon (30 min warning)
contest:ended              - Contest ended
contest:submission_update  - Submission in contest
contest:notifications      - Contest notifications
```

### Code Review Events
```
review:started             - Review started
review:completed           - Review completed with feedback
review:progress            - Review progress update
```

### Interview Events
```
interview:started          - Interview started
interview:question_asked   - New question asked
interview:answer_submitted - Answer submitted
interview:feedback         - Real-time feedback
interview:ended            - Interview ended
```

### Real-Time Collaboration (Optional)
```
user:online                - User came online
user:offline               - User went offline
presence:update            - User presence update in contest room
```

---

## 5. Message Queue Architecture (BullMQ + Redis)

### Queues & Job Types

#### Code Execution Queue
```
Jobs:
  - compile_code(language, code, problem_id)
  - run_tests(compiled_output, test_cases, language)
  - validate_submission(submission_id, test_results)
  
Retry Policy: 3 retries, exponential backoff
Timeout: 30 seconds per job
Priority: Can be prioritized by contest
```

#### AI Review Queue
```
Jobs:
  - analyze_code(submission_id, code, language)
  - generate_feedback(analysis_result)
  - suggest_improvements(code, analysis)
  
Retry Policy: 2 retries
Timeout: 120 seconds
Priority: Normal
```

#### Notification Queue
```
Jobs:
  - send_email(user_id, template, data)
  - send_push_notification(user_id, message)
  - send_slack_alert(channel, message)
  
Retry Policy: 5 retries
Timeout: 30 seconds
Priority: Low
```

#### Batch Processing Queue
```
Jobs:
  - generate_contest_report(contest_id)
  - calculate_recommendations(user_id)
  - update_user_stats(user_id)
  - export_data(user_id)
  
Retry Policy: 3 retries
Timeout: 300 seconds
Priority: Lowest
```

#### Analytics Queue
```
Jobs:
  - track_submission(submission_id, event_data)
  - update_leaderboard_cache(contest_id)
  - refresh_user_rating(user_id)
  
Retry Policy: 2 retries
Timeout: 60 seconds
Priority: Normal
```

---

## 6. Docker Worker Architecture

### Judge Worker (10+ Instances)
```dockerfile
Base Image: ubuntu:22.04 with:
  - GCC/G++, Python 3, Node.js, Java JDK
  - Isolated filesystem per execution
  - Resource limits: 256MB memory, 5s CPU time
  - Seccomp profiles for sandboxing

Responsibilities:
  - Compile user code
  - Execute against test cases
  - Capture output and errors
  - Return results to main server
  - Auto-restart on failure
```

### AI Worker (5+ Instances)
```dockerfile
Base Image: python:3.11 with:
  - PyTorch/TensorFlow
  - OpenAI/Claude SDK
  - Code analysis libraries
  - NLP models

Responsibilities:
  - Analyze code for patterns
  - Generate review comments
  - Suggest improvements
  - Rate code quality
  - Generate interview questions
```

### Batch Worker (3+ Instances)
```dockerfile
Base Image: node:20 with:
  - Report generation tools
  - Data processing libraries
  - Recommendation ML models

Responsibilities:
  - Generate reports
  - Calculate recommendations
  - Update statistics
  - Backup data
```

---

## 7. Scaling & Performance Strategy

### Horizontal Scaling
- Load balancer (NGINX) distributes across multiple Express servers
- Each server handles ~1000 concurrent WebSocket connections
- Database replicas for read scaling (10+ judge workers read submissions)
- Redis cluster for caching and queue distribution

### Caching Strategy
```
Application Cache (Redis):
  - User sessions (TTL: 24h)
  - Problem data (TTL: 1h)
  - Leaderboard rankings (TTL: 30s)
  - Contest data (TTL: 5m)
  - User stats (TTL: 5m)

Database Query Cache:
  - Most-viewed problems
  - User profile data
  - Problem tags & categories
```

### Database Optimization
```
Indexes:
  - users(email, username) - unique
  - submissions(user_id, problem_id, created_at)
  - contests(status, start_time)
  - leaderboard(contest_id, rank)
  - code_reviews(submission_id)
  
Partitioning:
  - Submissions by month
  - Leaderboard by contest
  - Analytics by user_id
```

### CDN & Static Content
- Images, CSS, JavaScript served from CloudFront
- Problem statements (markdown) cached
- User avatars from S3

---

## 8. Security Architecture

### API Security
- JWT tokens with 15-min expiry, refresh tokens with 7-day expiry
- Rate limiting: 100 requests/minute per user
- CORS enabled for frontend domain only
- Input validation and sanitization on all endpoints

### Code Execution Security
```
Sandboxing:
  - Docker containers with resource limits
  - Read-only filesystem for test cases
  - No network access from containers
  - No access to system clock
  - Capability dropping (drop all, add only needed)
  
Code Injection Prevention:
  - Compile code in isolated container
  - No eval() or dynamic code execution
  - Whitelist allowed system calls via Seccomp
```

### Data Security
```
Encryption:
  - TLS 1.3 for all in-transit data
  - Passwords hashed with bcrypt (cost: 12)
  - Sensitive data at rest encrypted (AES-256)
  
Authentication:
  - Multi-factor authentication (optional)
  - Google OAuth 2.0 integration
  - Session management with Redis
```

### Monitoring & Audit
```
Logs:
  - All API calls logged to CloudWatch
  - Code execution logs stored for 30 days
  - Failed login attempts tracked
  - Admin actions audited
  
Alerts:
  - Unusual submission patterns
  - High error rates in judge workers
  - Database connection issues
  - Memory/CPU threshold breaches
```

---

## 9. Deployment Architecture

### Production Deployment (AWS)
```
Region: Multi-region (US-EAST-1 Primary, US-WEST-2 Secondary)

Compute:
  - ECS Fargate for backend services (auto-scaling group: 5-20)
  - EC2 instances for workers (auto-scaling: 8-50 instances)
  - Lambda for cron jobs and reports

Database:
  - RDS PostgreSQL Multi-AZ (primary + read replicas)
  - Automated backups: daily, retention 30 days
  - Point-in-time recovery enabled

Caching & Queue:
  - ElastiCache Redis cluster (6 nodes, replication enabled)
  - BullMQ for job queue management

Networking:
  - Application Load Balancer (ALB)
  - CloudFront CDN for static assets
  - VPC with public/private subnets
  - Security groups with least privilege

Monitoring:
  - CloudWatch for metrics and logs
  - DataDog for APM and alerting
  - PagerDuty for on-call management
```

### High Availability
```
- Multi-AZ deployment for all components
- Auto-recovery for failed instances
- Database failover: automatic (< 2 min)
- RTO: 5 minutes, RPO: 1 minute
```

---

## 10. Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Project setup and infrastructure
- [ ] Database schema and migrations
- [ ] Authentication system (JWT + Google OAuth)
- [ ] Basic user management APIs
- [ ] Frontend authentication UI

### Phase 2: Core Platform (Weeks 3-5)
- [ ] Problem CRUD and listing
- [ ] Code submission and execution
- [ ] Judge worker implementation
- [ ] Basic test case validation
- [ ] Problem listing and detail pages

### Phase 3: Contest System (Weeks 6-7)
- [ ] Contest creation and management
- [ ] Contest submissions
- [ ] Real-time leaderboards
- [ ] WebSocket event infrastructure
- [ ] Contest UI and dashboard

### Phase 4: Advanced Features (Weeks 8-10)
- [ ] AI Code Review system
- [ ] Mock Interview platform
- [ ] Recommendation engine
- [ ] User statistics and analytics
- [ ] Admin dashboard

### Phase 5: Optimization & Polish (Weeks 11-12)
- [ ] Performance optimization
- [ ] Testing (unit, integration, e2e)
- [ ] Documentation
- [ ] Deployment and DevOps setup
- [ ] Monitoring and alerting

---

## 11. Interview Questions Based on This Architecture

### Design & Architecture
1. How would you scale the code execution system from 1K to 100K concurrent users?
2. Design the database schema for a competitive programming platform with contests.
3. How would you implement a real-time leaderboard for a live contest?
4. What trade-offs exist between storing vs. computing user statistics?

### Backend Implementation
5. How would you implement the submission execution pipeline?
6. Design the retry and error handling strategy for code execution failures.
7. How would you prevent code injection attacks in the judge?
8. Implement rate limiting for the API endpoints.

### System Design
9. How would you design a distributed code judge system?
10. Design the message queue architecture for async job processing.
11. How would you handle concurrent submissions to the same problem?
12. Design the caching strategy for leaderboards and problem data.

### DevOps & Operations
13. How would you containerize the judge worker?
14. Design the deployment strategy for zero-downtime updates.
15. How would you monitor and alert on code execution failures?
16. Design the disaster recovery plan for the system.

---

## Implementation Notes

### Code Organization Principles
- Clean Architecture with clear separation of concerns
- Repository Pattern for data access
- Service layer for business logic
- Dependency Injection for testability
- Factory Pattern for complex object creation

### Performance Targets
- API response time: < 200ms (p95)
- Code execution: < 5 seconds per submission
- WebSocket latency: < 100ms
- Database query time: < 50ms (p95)
- Cache hit rate: > 80%

### Monitoring Metrics
- Submission success rate
- Code execution latency distribution
- WebSocket connection count
- Queue job processing time
- Database connection pool usage
- Worker CPU and memory utilization

