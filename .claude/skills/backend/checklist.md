# Backend Implementation Checklist

## Core Checklist
- [ ] Checked existing entities/APIs via git before creating new ones
- [ ] Data model created in the chosen backend (tables / collections — see docs/STACK.md)
- [ ] Access control enabled on EVERY new table/collection (RLS policies / permissions / API rules / Security Rules)
- [ ] Access rules cover read, create, update, delete
- [ ] Indexes created on performance-critical fields
- [ ] Relationships set with appropriate delete behavior
- [ ] All planned API endpoints implemented in `/src/app/api/`
- [ ] Authentication verified (no access without a valid session)
- [ ] Input validation with Zod on all POST/PUT requests
- [ ] Meaningful error messages with correct HTTP status codes
- [ ] No TypeScript errors in API routes
- [ ] All endpoints tested manually
- [ ] No hardcoded secrets in source code; admin/service keys stay server-side
- [ ] Frontend connected to the real API endpoints
- [ ] User has reviewed and approved

## Verification (run before marking complete)
- [ ] `npm run build` passes without errors
- [ ] All acceptance criteria from the feature spec addressed in the API
- [ ] All API endpoints return correct status codes (test with curl or browser)
- [ ] `features/INDEX.md` status updated to "In Progress"
- [ ] Code committed to git

## Performance Checklist
- [ ] All frequently filtered fields have indexes
- [ ] No N+1 queries (use the backend's joins / expand / relations instead of loops)
- [ ] All list queries use a limit
- [ ] Zod validation on all write endpoints
- [ ] Slow queries cached where appropriate (optional for MVP)
- [ ] Rate limiting on public-facing APIs (optional for MVP)
