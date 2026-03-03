import "dotenv/config";

import express from "express";
import cors from "cors";
import session from "express-session";
import { config } from "./config";
import passport from "./auth/google.strategy";
import emailRoutes from "./routes/email.routes";

let workerStarted = false;

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

// ── Session ─────────────────────────────────────────────────
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
  })
);

// ── Passport ────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

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
  }),
  (_req, res) => {
    res.redirect(`${config.frontendUrl}/dashboard`);
  }
);

app.get("/auth/me", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

app.post("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.status(200).json({ message: "Logged out" });
  });
});

// ── Start server ────────────────────────────────────────────
app.listen(config.port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${config.port}`)
})