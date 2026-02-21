import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();

// Script Lua: atómico en Redis, no puede haber race condition
const JOIN_SCRIPT = `
local key = KEYS[1]
local playerName = ARGV[1]
local aspirantId = ARGV[2]

local raw = redis.call('GET', key)
if not raw then return {err = 'NOT_FOUND'} end

local room = cjson.decode(raw)

-- Idempotente: ya está en la sala
if room.aspirants then
  for _, a in ipairs(room.aspirants) do
    if a.name == playerName then
      return cjson.encode(room)
    end
  end
else
  room.aspirants = {}
end

if not room.scores then room.scores = {} end

table.insert(room.aspirants, {name = playerName, id = aspirantId})
room.scores[aspirantId] = 0

local serialized = cjson.encode(room)
redis.call('SET', key, serialized, 'EX', 86400)
return serialized
`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { roomCode, playerName } = req.body;
  if (!roomCode || !playerName) return res.status(400).json({ error: "roomCode and playerName required" });

  const key = `room_${roomCode.toUpperCase()}`;
  const aspirantId = Date.now().toString() + Math.random().toString(36).slice(2, 5);

  try {
    const result = await redis.eval(JOIN_SCRIPT, [key], [playerName, aspirantId]);

    if (!result) return res.status(404).json({ error: "Sala no encontrada" });

    const room = typeof result === "string" ? JSON.parse(result) : result;
    return res.status(200).json({ room });
  } catch (error) {
    console.error("Join error:", error);
    return res.status(500).json({ error: "Error interno: " + error.message });
  }
}
