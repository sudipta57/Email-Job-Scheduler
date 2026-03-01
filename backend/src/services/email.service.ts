import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
import { config } from "../config";

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: config.etherealUser,
    pass: config.etherealPass,
  },
});

interface SendEmailData {
  to: string;
  subject: string;
  body: string;
  sender: string;
  emailId: string;
}

export async function sendEmail(jobData: SendEmailData) {
  try {
    const info = await transporter.sendMail({
      from: jobData.sender,
      to: jobData.to,
      subject: jobData.subject,
      html: jobData.body,
    });

    await prisma.email.update({
      where: { id: jobData.emailId },
      data: { status: "SENT", sentAt: new Date() },
    });

    return info;
  } catch (error) {
    await prisma.email.update({
      where: { id: jobData.emailId },
      data: { status: "FAILED" },
    });

    throw error;
  }
}

function getCurrentHourWindow(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  return `${year}-${month}-${day}-${hour}`;
}

export async function incrementRateLimit(sender: string): Promise<number> {
  const hourWindow = getCurrentHourWindow();

  const record = await prisma.rateLimitCounter.upsert({
    where: { sender_hourWindow: { sender, hourWindow } },
    update: { count: { increment: 1 } },
    create: { sender, hourWindow, count: 1 },
  });

  return record.count;
}

export async function getRateLimit(sender: string): Promise<number> {
  const hourWindow = getCurrentHourWindow();

  const record = await prisma.rateLimitCounter.findUnique({
    where: { sender_hourWindow: { sender, hourWindow } },
  });

  return record?.count ?? 0;
}
