import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 12 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  )
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters, letters and digits).",
    );
  const prisma = new PrismaClient();
  try {
    await prisma.$transaction(async (tx) => {
      if (await tx.users.findUnique({ where: { email_normalized: email } }))
        throw new Error(
          "Account already exists; bootstrap never overwrites existing credentials.",
        );
      const role = await tx.roles.findUniqueOrThrow({
        where: { code: "ADMIN" },
      });
      const user = await tx.users.create({
        data: {
          email,
          email_normalized: email,
          password_hash: await argon2.hash(password, { type: argon2.argon2id }),
          status: "ACTIVE",
          email_verified_at: new Date(),
          mfa_enabled: true,
        },
      });
      await tx.user_roles.create({
        data: { user_id: user.id, role_id: role.id },
      });
      await tx.audit_events.create({
        data: {
          actor_user_id: user.id,
          action: "admin.bootstrapped",
          target_type: "user",
          target_id: user.id,
          correlation_id: crypto.randomUUID(),
        },
      });
      const opens = process.env.REGISTRATION_OPENS_AT,
        closes = process.env.REGISTRATION_CLOSES_AT;
      if (opens || closes) {
        if (
          !opens ||
          !closes ||
          !Number.isFinite(Date.parse(opens)) ||
          !Number.isFinite(Date.parse(closes)) ||
          new Date(closes) <= new Date(opens)
        )
          throw new Error(
            "Registration dates must be valid ISO dates; closing must follow opening.",
          );
        await tx.competitions.upsert({
          where: { code: process.env.COMPETITION_CODE || "IS-NEXTGEN-2026" },
          update: {},
          create: {
            code: process.env.COMPETITION_CODE || "IS-NEXTGEN-2026",
            name:
              process.env.COMPETITION_NAME ||
              "IS-NextGen Manager Challenge 2026",
            registration_opens_at: new Date(opens),
            registration_closes_at: new Date(closes),
          },
        });
      }
    });
    console.log(
      "Admin provisioned. Sign in with email and password, then verify the emailed OTP.",
    );
  } finally {
    await prisma.$disconnect();
  }
}
void main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
