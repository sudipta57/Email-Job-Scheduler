import { Queue } from "bullmq";
import { config } from "../config";

export const EMAIL_QUEUE_NAME = "email-queue";

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

console.log("Redis connection config:", {
  host: connection.host,
  port: connection.port,
  hasPassword: !!connection.password,
  tls: !!connection.tls,
});

let queueInstance: Queue;

try {
  queueInstance = new Queue(EMAIL_QUEUE_NAME, { connection });
  queueInstance.on("error", (err) => {
    console.error("Queue error:", err.message);
  });
} catch (err) {
  console.error("Queue failed to initialize:", err);
  queueInstance = null as unknown as Queue;
}

export const emailQueue = queueInstance;