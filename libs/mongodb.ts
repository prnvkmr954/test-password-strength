import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB_NAME as string;

if (!uri) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

if (!dbName) {
  throw new Error("MONGODB_DB_NAME is not defined in environment variables");
}

let client: MongoClient | null = null;

/**
 * Returns a singleton MongoClient. Creates it on first call, reuses on subsequent calls.
 */
export async function getClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(uri, {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000,
      appName: "poc-typescript-password-history",
    });
    await client.connect();
    console.log("✅ MongoDB connected");
  }
  return client;
}

/**
 * Returns the Db instance for the configured database name.
 */
export async function getDb(): Promise<Db> {
  const mongoClient = await getClient();
  return mongoClient.db(dbName);
}

/**
 * Closes the MongoDB connection and resets the singleton.
 */
export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    console.log("🔌 MongoDB connection closed");
  }
}
