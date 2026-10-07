import { PrismaClient } from "@prisma/client";

async function main() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ALLOW_LOCAL_OTP !== "1"
  )
    throw new Error(
      "Only available in local development with ALLOW_LOCAL_OTP=1.",
    );
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const db = new PrismaClient();
  try {
    const challenge = await db.auth_challenges.findFirst({
      where: {
        email_normalized: email,
        purpose: "MFA",
        consumed_at: null,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: "desc" },
    });
    if (!challenge)
      throw new Error(
        "No pending Admin MFA challenge. Submit the login form first.",
      );
    const intent = await db.notification_intents.findUniqueOrThrow({
      where: { deduplication_key: `challenge:${challenge.id}` },
    });
    console.log("Local Admin OTP:", (intent.payload as { code: string }).code);
  } finally {
    await db.$disconnect();
  }
}
void main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
