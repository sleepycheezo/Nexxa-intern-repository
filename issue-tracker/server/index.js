import express from "express";
import cors from "cors";
import { getDb } from "./db.js";

const PORT = process.env.PORT || 5050;

const DEFAULT_ROLES = ["Support Agent"];
const DEFAULT_CATEGORIES = ["Hardware", "Software", "Network", "Access / Permissions", "Other"];
const DEFAULT_USERS = [
  { id: "USR-seed-1", firstName: "Chiazo", lastName: "Ajulu", role: "Support Agent" },
  { id: "USR-seed-2", firstName: "Damipe", lastName: "Olayinka", role: "Support Agent" },
  { id: "USR-seed-3", firstName: "Isabella", lastName: "Oge", role: "Support Agent" },
];

async function seedIfEmpty(db) {
  const settings = db.collection("settings");
  const users = db.collection("users");

  if (!(await settings.findOne({ _id: "roles" }))) {
    await settings.insertOne({ _id: "roles", values: DEFAULT_ROLES });
  }
  if (!(await settings.findOne({ _id: "categories" }))) {
    await settings.insertOne({ _id: "categories", values: DEFAULT_CATEGORIES });
  }
  if ((await users.countDocuments()) === 0) {
    await users.insertMany(DEFAULT_USERS);
  }
}

function withoutMongoId(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
}

async function main() {
  const db = await getDb();
  await seedIfEmpty(db);

  const app = express();
  app.use(cors());
  app.use(express.json());

  const issues = db.collection("issues");
  const users = db.collection("users");
  const settings = db.collection("settings");

  // Issues
  app.get("/api/issues", async (_req, res) => {
    const all = await issues.find().sort({ createdAt: -1 }).toArray();
    res.json(all.map(withoutMongoId));
  });

  app.post("/api/issues", async (req, res) => {
    const issue = {
      id: `ISS-${Date.now()}`,
      status: "open",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      ...req.body,
    };
    await issues.insertOne(issue);
    res.status(201).json(withoutMongoId(issue));
  });

  app.patch("/api/issues/:id", async (req, res) => {
    await issues.updateOne({ id: req.params.id }, { $set: req.body });
    const updated = await issues.findOne({ id: req.params.id });
    res.json(withoutMongoId(updated));
  });

  app.delete("/api/issues/:id", async (req, res) => {
    await issues.deleteOne({ id: req.params.id });
    res.status(204).end();
  });

  // Setup: roles, categories, users
  app.get("/api/setup", async (_req, res) => {
    const [rolesDoc, categoriesDoc, allUsers] = await Promise.all([
      settings.findOne({ _id: "roles" }),
      settings.findOne({ _id: "categories" }),
      users.find().toArray(),
    ]);
    res.json({
      roles: rolesDoc?.values ?? [],
      categories: categoriesDoc?.values ?? [],
      users: allUsers.map(withoutMongoId),
    });
  });

  app.post("/api/roles", async (req, res) => {
    await settings.updateOne(
      { _id: "roles" },
      { $addToSet: { values: req.body.name } },
      { upsert: true }
    );
    const doc = await settings.findOne({ _id: "roles" });
    res.status(201).json(doc.values);
  });

  app.delete("/api/roles/:name", async (req, res) => {
    await settings.updateOne({ _id: "roles" }, { $pull: { values: req.params.name } });
    const doc = await settings.findOne({ _id: "roles" });
    res.json(doc?.values ?? []);
  });

  app.post("/api/categories", async (req, res) => {
    await settings.updateOne(
      { _id: "categories" },
      { $addToSet: { values: req.body.name } },
      { upsert: true }
    );
    const doc = await settings.findOne({ _id: "categories" });
    res.status(201).json(doc.values);
  });

  app.delete("/api/categories/:name", async (req, res) => {
    await settings.updateOne({ _id: "categories" }, { $pull: { values: req.params.name } });
    const doc = await settings.findOne({ _id: "categories" });
    res.json(doc?.values ?? []);
  });

  app.post("/api/users", async (req, res) => {
    const user = { id: `USR-${Date.now()}`, ...req.body };
    await users.insertOne(user);
    res.status(201).json(withoutMongoId(user));
  });

  app.delete("/api/users/:id", async (req, res) => {
    await users.deleteOne({ id: req.params.id });
    res.status(204).end();
  });

  app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
