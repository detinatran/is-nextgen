import { execSync } from 'node:child_process';

/** Ensures the schema exists before suites run (migrations are idempotent). */
export default function globalSetup(): void {
  const url = process.env['DATABASE_URL'] as string;
  execSync(`npx prisma migrate deploy`, {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}
