import { Router } from "express";
import {
  scheduleEmail,
  scheduleBulk,
  getScheduledEmails,
  getSentEmails,
  getEmailById,
} from "../controllers/email.controller";

const router = Router();

router.post("/schedule", scheduleEmail);
router.post("/schedule-bulk", scheduleBulk);
router.get("/scheduled", getScheduledEmails);
router.get("/sent", getSentEmails);
router.get("/:id", getEmailById);

export default router;
