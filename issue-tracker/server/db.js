import { MongoClient } from "mongodb";
import "dotenv/config";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not set. Add it to issue-tracker/.env");
}

const client = new MongoClient(uri);
let dbPromise;

export function getDb() {
  if (!dbPromise) {
    dbPromise = client.connect().then(() => client.db("issue-tracker"));
  }
  return dbPromise;
}
