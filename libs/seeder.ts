import { Db } from "mongodb";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

// ─── Types ────────────────────────────────────────────────────────────────────

type PasswordHistoryEntry = {
  password: string;
  created_at: Date;
};

type SeedUser = {
  username: string;
  plainPasswords: string[]; // index 0 = oldest, last = current
};

// ─── Demo users ───────────────────────────────────────────────────────────────
// Each user has a realistic password history so you can immediately test:
//   - Login with their current password (last entry)
//   - Attempt to reuse any previous password (should 409)
//   - Change to a brand-new password (should 200)

const SEED_USERS: SeedUser[] = [
  {
    username: "pranav_verma",
    plainPasswords: ["Pranav@001", "Pranav@002", "Pranav@003"],
  },
  {
    username: "aarav_singh",
    plainPasswords: ["Aarav#2023", "Aarav#2024"],
  },
  {
    username: "diya_sharma",
    plainPasswords: ["Diya$Pass1", "Diya$Pass2", "Diya$Pass3", "Diya$Pass4"],
  },
  {
    username: "rohan_mehta",
    plainPasswords: ["Rohan!Secure1", "Rohan!Secure2"],
  },
  {
    username: "priya_nair",
    plainPasswords: ["Priya@Nair1", "Priya@Nair2", "Priya@Nair3"],
  },
  {
    username: "karan_gupta",
    plainPasswords: ["Karan#Gupta9", "Karan#Gupta10"],
  },
  {
    username: "ananya_iyer",
    plainPasswords: ["Ananya!2024", "Ananya!2025"],
  },
  {
    username: "vikram_bose",
    plainPasswords: ["Vikram$Bose1", "Vikram$Bose2", "Vikram$Bose3"],
  },
  {
    username: "sneha_pillai",
    plainPasswords: ["Sneha@Pass1", "Sneha@Pass2"],
  },
  {
    username: "arjun_rawat",
    plainPasswords: ["Arjun!Raw@t1", "Arjun!Raw@t2", "Arjun!Raw@t3"],
  },
];

// ─── Seeder ───────────────────────────────────────────────────────────────────

export async function seedDatabase(db: Db): Promise<void> {
  const collection = db.collection("users");

  // Check if any data already exists — if yes, skip entirely
  const existingCount = await collection.countDocuments();
  if (existingCount > 0) {
    console.log(
      `⏭️  Seeder skipped — ${existingCount} user(s) already exist in the database.`
    );
    return;
  }

  console.log("🌱 No data found. Running seeder...");

  const now = new Date();
  const docs = [];

  for (const user of SEED_USERS) {
    const passwordHistory: PasswordHistoryEntry[] = [];

    // Hash all passwords for this user (oldest → newest)
    for (let i = 0; i < user.plainPasswords.length; i++) {
      const hashed = await bcrypt.hash(user.plainPasswords[i], SALT_ROUNDS);
      // Space out created_at timestamps so history looks realistic
      const created_at = new Date(
        now.getTime() - (user.plainPasswords.length - i) * 30 * 24 * 60 * 60 * 1000
      );
      passwordHistory.push({ password: hashed, created_at });
    }

    // The current (active) password is always the last one
    const currentHash = passwordHistory[passwordHistory.length - 1].password;

    docs.push({
      username: user.username,
      password: currentHash,
      password_history: passwordHistory,
      created_at: passwordHistory[0].created_at,
      updated_at: passwordHistory[passwordHistory.length - 1].created_at,
    });
  }

  await collection.insertMany(docs);

  console.log(`✅ Seeder complete — ${docs.length} demo users inserted:`);
  SEED_USERS.forEach((u) => {
    const current = u.plainPasswords[u.plainPasswords.length - 1];
    const history = u.plainPasswords.slice(0, -1);
    console.log(
      `   👤 ${u.username.padEnd(16)} current: ${current.padEnd(18)} history: [${history.join(", ")}]`
    );
  });
  console.log("");
}
