import "dotenv/config";

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import IORedis from "ioredis";
import { config } from "./config";
import passport from "./auth/google.strategy";
import emailRoutes from "./routes/email.routes";

let workerStarted = false;

const testRedis = async () => {
  try {
    const redisUrl = new URL(config.redisUrl);
    const redis = new IORedis({
      host: redisUrl.hostname,
      port: Number(redisUrl.port),
      username: redisUrl.username || "default",
      password: redisUrl.password,
      tls:
        redisUrl.protocol === "rediss:"
          ? { rejectUnauthorized: false }
          : undefined,
    });
    await redis.ping();
    console.log("✅ Redis connected successfully");
    await redis.quit();
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
  }
};

testRedis();

try {
  require("./workers/email.worker");
  workerStarted = true;
} catch (err) {
  console.error("Worker failed to start:", err);
}

const app = express();

// ── Middlewares ──────────────────────────────────────────────
app.use(
 cors({
  origin: ['http://localhost:3000', config.frontendUrl],
  credentials: true
})
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Passport ────────────────────────────────────────────────
app.use(passport.initialize());

// ── Health check ────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", workerStarted });
});

// ── Email routes ────────────────────────────────────────────
app.use("/api/emails", emailRoutes);

// ── Auth routes ─────────────────────────────────────────────
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${config.frontendUrl}/login`,
    session: false,
  }),
  (req, res) => {
    const token = jwt.sign(req.user as object, config.sessionSecret, { expiresIn: '7d' });
    res.redirect(`${config.frontendUrl}/dashboard?token=${token}`);
  }
);

app.get("/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const token = authHeader.split(' ')[1];
    const user = jwt.verify(token, config.sessionSecret);
    return res.json(user);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

app.post("/auth/logout", (_req, res) => {
  res.status(200).json({ message: "Logged out" });
});

// ── Start server ────────────────────────────────────────────
app.listen(config.port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${config.port}`)
})