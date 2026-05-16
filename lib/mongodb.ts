import { MongoClient } from "mongodb";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Lazily creates and reuses the MongoDB client so importing this module never
// tries to connect during build time when env vars are missing.
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "service-db";
const options = {};

export default function getClientPromise() {
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Set it in your environment.");
  }

  const client = new MongoClient(uri, options);

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  return client.connect();
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db(dbName);
}
