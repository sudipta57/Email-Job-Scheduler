import { Queue } from "bullmq";
import { config } from "../config";

export const EMAIL_QUEUE_NAME = "email-queue";

const redisUrl = new URL(config.redisUrl);
const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
};

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, { connection });