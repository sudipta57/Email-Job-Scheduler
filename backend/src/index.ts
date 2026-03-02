import "dotenv/config";

import express from "express";
import cors from "cors";
import session from "express-session";
import { config } from "./config";
import passport from "./auth/google.strategy";
import emailRoutes from "./routes/email.routes";
import "./workers/email.worker";

const app = express();

// ── Middlewares ──────────────────────────────────────────────
app.use(
 cors({
  origin: ['http://localhost:3000', 'https://your-vercel-url.vercel.app'],
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
  res.json({ status: "ok" });
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
    failureRedirect: "http://localhost:3000/login",
  }),
  (_req, res) => {
    res.redirect("http://localhost:3000/dashboard");
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
app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
