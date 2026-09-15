import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "Agent";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add your real MongoDB Atlas connection string to .env.local."
    );
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect();
    }
    return global._mongoClientPromise;
  }

  return new MongoClient(uri).connect();
}

let clientPromise: Promise<MongoClient> | undefined;

export async function getDb(): Promise<Db> {
  if (!clientPromise) {
    clientPromise = getClientPromise();
  }
  const client = await clientPromise;
  return client.db(dbName);
}
