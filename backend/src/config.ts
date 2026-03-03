import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 8080,
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  databaseUrl: process.env.DATABASE_URL!,
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  sessionSecret: process.env.SESSION_SECRET!,
  etherealUser: process.env.ETHEREAL_USER!,
  etherealPass: process.env.ETHEREAL_PASS!,
  maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || "200", 10),
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || "5", 10),
  emailDelayMs: parseInt(process.env.EMAIL_DELAY_MS || "2000", 10),
  backendUrl: process.env.BACKEND_URL || "http://localhost:4000",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};
