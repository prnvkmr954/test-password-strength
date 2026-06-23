import * as dotenv from "dotenv";
dotenv.config(); // Must be called BEFORE any other imports that read process.env

import express from "express";
import { getDb, closeConnection } from "./libs/mongodb";
import passwordRouter from "./routes/passwords";

const app = express();
const PORT = process.env.PORT ?? 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// Optional: log every incoming request during development
app.use((req, _res, next) => {
  console.log(`→ ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/users", passwordRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function start() {
  try {
    const db = await getDb();

    // Create a unique index on username — this replaces the need for a manual
    // "does this username exist?" check before every insert.
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    console.log("✅ Unique index on users.username ensured");

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running at http://localhost:${PORT}`);
      console.log(`   Try: curl http://localhost:${PORT}/health\n`);
    });

    // Graceful shutdown — important for containerized environments
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received — shutting down gracefully...`);
      server.close(async () => {
        await closeConnection();
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
