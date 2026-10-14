# CyberLab learning engine

## Diagnostic interpretation

The initial diagnostic contains ten introductory multiple-choice questions covering security foundations, networking, passwords and authentication, phishing, and basic web security. It is an orientation aid, not a professional certification or a definitive assessment of ability.

The API calculates the percentage on the server:

- **BEGINNER:** below 50% — start with **Fundamentos de Cibersegurança**.
- **ELEMENTARY:** 50% through 79% — start with **Redes e Segurança Web**.
- **INTERMEDIATE:** 80% or higher — start with **Phishing e Engenharia Social**.

Every submission creates a new `DiagnosticAttempt`. The most recently completed attempt updates the student's current profile level; earlier attempts remain in the student's progress history. A student cannot submit a score or level.

## Mission scoring and progress

Each mission is a controlled, fictional decision exercise. The server validates the selected option and awards the mission's configured points only for the correct answer; an incorrect answer scores zero and receives explanatory feedback. Answer keys and explanations are omitted from mission detail responses and returned only after an attempt.

All attempts are retained. Progress counts a mission as complete after any correct attempt and counts only the highest score for each mission toward points earned. Repeating a mission therefore does not add its points again.

## Development setup

Apply the additive Prisma migration with `pnpm --filter @workspace/api-server run db:migrate:deploy`, then run `pnpm --filter @workspace/api-server run db:seed`. Seeding is idempotent and inserts the three published modules and twelve fictional missions without modifying users or existing attempts.

Integration tests use a separate `cyberlab_auth_test` PostgreSQL schema and run the migration and seed there before tests. Never point these test commands at production.
