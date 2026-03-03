import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { config } from "../config";
import { EMAIL_QUEUE_NAME, emailQueue } from "../queues/email.queue";
import {
  getRateLimit,
  incrementRateLimit,
  sendEmail,
} from "../services/email.service";

const prisma = new PrismaClient();

const redisUrl = new URL(config.redisUrl);
const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  username: redisUrl.username || 'default',
  password: redisUrl.password,
  tls: redisUrl.protocol === 'rediss:' ? {
    rejectUnauthorized: false
  } : undefined,
  maxRetriesPerRequest: null,
};

let worker: Worker | null = null;

try {
  worker = new Worker(
    EMAIL_QUEUE_NAME,
    async (job: Job) => {
      const { to, subject, body, sender, emailId } = job.data;

      try {
        // 1. Idempotency check
        const email = await prisma.email.findUnique({ where: { id: emailId } });
        if (email?.status === "SENT") {
          console.log(`Job ${job.id}: Already sent, skipping`);
          return;
        }

        // 2. Rate limit check
        const currentCount = await getRateLimit(sender);
        if (currentCount >= config.maxEmailsPerHour) {
          const now = new Date();
          const nextHour = new Date(now);
          nextHour.setHours(now.getHours() + 1, 0, 0, 0);
          const delayMs = nextHour.getTime() - now.getTime();

          await emailQueue.add("send-email", job.data, {
            delay: delayMs,
            jobId: `retry-${job.id}-${Date.now()}`,
          });

          console.log(
            `Job ${job.id}: Rate limit reached, rescheduling to next hour`
          );
          return;
        }

        // 3. Send the email
        await incrementRateLimit(sender);
        await new Promise((resolve) =>
          setTimeout(resolve, config.emailDelayMs)
        );
        await sendEmail({ to, subject, body, sender, emailId });

        console.log(`Job ${job.id}: Email sent successfully`);
      } catch (error) {
        console.error(`Job ${job.id} error:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: config.workerConcurrency,
    }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed: ${err.message}`);
  });

  worker.on("error", (err) => {
    console.error("Worker error:", err.message);
  });
} catch (err) {
  console.error("Worker failed to initialize:", err);
}

export { worker };