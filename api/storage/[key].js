import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { key } = req.query;

  if (req.method === "GET") {
    const value = await redis.get(key);
    if (value === null) return res.status(404).json({ error: "Key not found" });
    return res.status(200).json({ key, value });
  }

  if (req.method === "POST") {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: "Value is required" });
    await redis.set(key, value, { ex: 86400 });
    return res.status(200).json({ key, value });
  }

  if (req.method === "DELETE") {
    await redis.del(key);
    return res.status(200).json({ key, deleted: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}