import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { emailQueue } from "../queues/email.queue";

const prisma = new PrismaClient();

export const scheduleEmail = async (req: Request, res: Response) => {
  try {
    const { to, subject, body, sender, scheduledAt } = req.body;

    if (!to || !subject || !body || !sender || !scheduledAt) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const email = await prisma.email.create({
      data: {
        to,
        subject,
        body,
        sender,
        scheduledAt: new Date(scheduledAt),
        status: "PENDING",
      },
    });

    const delay = Math.max(new Date(scheduledAt).getTime() - Date.now(), 0);

    await emailQueue.add(
      "send-email",
      { to, subject, body, sender, emailId: email.id },
      { delay, jobId: email.id }
    );

    await prisma.email.update({
      where: { id: email.id },
      data: { jobId: email.id },
    });

    return res.status(201).json(email);
  } catch (error) {
    console.error("scheduleEmail error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getScheduledEmails = async (_req: Request, res: Response) => {
  try {
    const emails = await prisma.email.findMany({
      where: { status: "PENDING" },
    });

    return res.status(200).json(emails);
  } catch (error) {
    console.error("getScheduledEmails error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getSentEmails = async (_req: Request, res: Response) => {
  try {
    const emails = await prisma.email.findMany({
      where: {
        status: { in: ["SENT", "FAILED"] },
      },
      orderBy: { sentAt: "desc" },
    });

    return res.status(200).json(emails);
  } catch (error) {
    console.error("getSentEmails error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const scheduleBulk = async (req: Request, res: Response) => {
  try {
    const { emails, subject, body, sender, startAt, delayBetweenMs, hourlyLimit } = req.body;

    if (!emails || !subject || !body || !sender || !startAt || delayBetweenMs == null || hourlyLimit == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const startTime = new Date(startAt).getTime();

    for (let index = 0; index < emails.length; index++) {
      const { to } = emails[index];
      const scheduledAt = new Date(startTime + index * delayBetweenMs);

      const email = await prisma.email.create({
        data: {
          to,
          subject,
          body,
          sender,
          scheduledAt,
          status: "PENDING",
        },
      });

      const delay = Math.max(scheduledAt.getTime() - Date.now(), 0);

      await emailQueue.add(
        "send-email",
        { to, subject, body, sender, emailId: email.id },
        { delay, jobId: email.id }
      );

      await prisma.email.update({
        where: { id: email.id },
        data: { jobId: email.id },
      });
    }

    return res.status(201).json({ scheduled: emails.length });
  } catch (error) {
    console.error("scheduleBulk error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getEmailById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const email = await prisma.email.findUnique({
      where: { id },
    });

    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

    return res.status(200).json(email);
  } catch (error) {
    console.error("getEmailById error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
