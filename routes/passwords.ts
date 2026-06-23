import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { getDb } from "../libs/mongodb";
import { MongoServerError } from "mongodb";
import { validate } from "../libs/validate";

// ─── Constants ───────────────────────────────────────────────────────────────

const SALT_ROUNDS = 12;

/**
 * How many previous passwords to keep in history.
 * Increase for stricter compliance requirements (e.g., NIST recommends checking last 10+).
 */
const PASSWORD_HISTORY_LIMIT = 5;

// ─── TypeScript Types ─────────────────────────────────────────────────────────

type PasswordHistoryEntry = {
  password: string;
  created_at: Date;
};

type UserDocument = {
  username: string;
  password: string;
  password_history: PasswordHistoryEntry[];
  created_at: Date;
  updated_at: Date;
};

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

/**
 * Strong password rules:
 *  - Min 8 characters
 *  - At least 1 uppercase letter
 *  - At least 1 lowercase letter
 *  - At least 1 digit
 *  - At least 1 special character
 */
const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one digit")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character (e.g. !@#$%)");

const registerSchema = z.object({
  username: z.string().min(1, "Username is required").trim(),
  password: strongPasswordSchema,
});

// Login intentionally does NOT use strongPasswordSchema — users registered before
// policy changes still need to authenticate so they can rotate their password.
const loginSchema = z.object({
  username: z.string().min(1, "Username is required").trim(),
  password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: strongPasswordSchema,
});

// ─── bcrypt Helpers ───────────────────────────────────────────────────────────

async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

/**
 * Checks if `plaintext` matches any hash in the history array.
 * Must use bcrypt.compare — you cannot do string equality because bcrypt salts
 * are random, meaning two hashes of the same password look completely different.
 */
async function isPasswordInHistory(
  plaintext: string,
  history: PasswordHistoryEntry[]
): Promise<boolean> {
  for (const entry of history) {
    const match = await bcrypt.compare(plaintext, entry.password);
    if (match) return true;
  }
  return false;
}

// ─── Router ───────────────────────────────────────────────────────────────────

const router = Router();

// ── GET /users  (DEV ONLY — never ship this in production!) ──────────────────
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const users = await db.collection<UserDocument>("users").find({}).toArray();
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /users  — Register a new user ───────────────────────────────────────
router.post(
  "/",
  validate(registerSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body as z.infer<typeof registerSchema>;

    try {
      const db = await getDb();
      const hashed = await hashPassword(password);
      const now = new Date();

      await db.collection("users").insertOne({
        username,
        password: hashed,
        // Seed history with the very first password so it can't be reused on first rotate
        password_history: [{ password: hashed, created_at: now }],
        created_at: now,
        updated_at: now,
      });

      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      // MongoDB duplicate-key error (unique index on username)
      if (err instanceof MongoServerError && err.code === 11000) {
        res.status(409).json({ error: "Username already taken" });
        return;
      }
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ── POST /users/login  — Authenticate ────────────────────────────────────────
router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body as z.infer<typeof loginSchema>;

    try {
      const db = await getDb();
      const user = await db.collection<UserDocument>("users").findOne({ username });

      // Return the SAME error for "user not found" and "wrong password".
      // Different messages would let attackers enumerate valid usernames.
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      res.status(200).json({
        message: "Login successful",
        user: { username: user.username, created_at: user.created_at },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ── PUT /users/:username/password  — Change password ─────────────────────────
router.put(
  "/:username/password",
  validate(changePasswordSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { username } = req.params;
    const { current_password, new_password } = req.body as z.infer<
      typeof changePasswordSchema
    >;

    try {
      const db = await getDb();
      const users = db.collection<UserDocument>("users");

      const user = await users.findOne({ username });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Step 1: Verify the caller knows the current password
      const currentValid = await verifyPassword(current_password, user.password);
      if (!currentValid) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }

      // Step 2: Reject if the new password was used before
      const history = user.password_history ?? [];
      const alreadyUsed = await isPasswordInHistory(new_password, history);
      if (alreadyUsed) {
        res.status(409).json({
          error: `This password was used before. Please choose one of your last ${PASSWORD_HISTORY_LIMIT} passwords.`,
          hint: `We keep the last ${PASSWORD_HISTORY_LIMIT} password hashes on file.`,
        });
        return;
      }

      // Step 3: Hash and persist
      const hashed = await hashPassword(new_password);
      const now = new Date();

      // Atomically: update root password + append to history (capped at HISTORY_LIMIT)
      const cappedHistory = [
        ...history.slice(-(PASSWORD_HISTORY_LIMIT - 1)),
        { password: hashed, created_at: now },
      ];

      await users.updateOne(
        { username },
        {
          $set: {
            password: hashed,
            password_history: cappedHistory,
            updated_at: now,
          },
        }
      );

      res.status(200).json({
        message: "Password updated successfully",
        history_entries: cappedHistory.length,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ── DELETE /users/:username  — Remove a user (dev/testing convenience) ───────
router.delete(
  "/:username",
  async (req: Request, res: Response): Promise<void> => {
    const { username } = req.params;
    try {
      const db = await getDb();
      const result = await db.collection("users").deleteOne({ username });
      if (result.deletedCount === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(200).json({ message: `User '${username}' deleted` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
