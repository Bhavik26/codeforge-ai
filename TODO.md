# CodeForge AI - TODO

## Phase 2 — Problem System (Production-grade)

✅ Phase 1 complete (foundation already present)


### Step 1: Prisma model alignment
- [ ] Update `apps/backend/prisma/schema.prisma`:
  - Add Problem constraints storage
  - Add Problem examples storage
  - Update TestCase to include weight and visibility
- [ ] Add/adjust indexes for performance

### Step 2: Zod schemas (validation)
- [ ] Implement `apps/backend/src/schemas/problem.schema.ts` (currently empty)
- [ ] Update `apps/backend/src/schemas/testcase.schema.ts` for weight/visibility

### Step 3: Repository updates
- [ ] Update `apps/backend/src/repositories/ProblemRepository.ts` to persist constraints/examples
- [ ] Update `apps/backend/src/repositories/TestCaseRepository.ts` to persist weight/visibility

### Step 4: Service updates
- [ ] Update `apps/backend/src/services/ProblemService.ts` to implement required admin semantics (tags/difficulty/constraints/explanation/examples)
- [ ] Update `apps/backend/src/services/TestCaseService.ts` to support hidden/sample test cases + weight/visibility

### Step 5: Audit logging (admin actions)
- [ ] Add audit log writes for create/update/delete/publish/unpublish problem
- [ ] Add audit log writes for create/update/delete test cases

### Step 6: Compile & smoke test
- [ ] Run Prisma migration + generate
- [ ] Typecheck backend
- [ ] Smoke test key endpoints (problem CRUD, test case add/list)

