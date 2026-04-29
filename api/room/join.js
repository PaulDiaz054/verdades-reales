import { Redis } from "@upstash/redis";
import { setCors, parseRoom } from "./_helpers.js";

const redis = Redis.fromEnv();

const JOIN_SCRIPT = `
local key   = KEYS[1]
local name  = ARGV[1]
local id    = ARGV[2]

local raw = redis.call('GET', key)
if not raw then return {err = 'NOT_FOUND'} end

local room = cjson.decode(raw)

if not room.aspirants then room.aspirants = {} end
for _, a in ipairs(room.aspirants) do
  if a.name == name then return cjson.encode(room) end
end

if not room.scores  then room.scores  = {} end
if not room.answers then room.answers = {} end

table.insert(room.aspirants, { name = name, id = id })
room.scores[id]  = 0
room.answers[id] = {}

redis.call('SET', key, cjson.encode(room), 'EX', 86400)
return cjson.encode(room)
`;

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { roomCode, playerName } = req.body;
  if (!roomCode || !playerName)
    return res.status(400).json({ error: "Missing fields" });

  const key        = `room_${roomCode.toUpperCase()}`;
  const aspirantId = `${Date.now()}${Math.random().toString(36).slice(2, 5)}`;

  try {
    const result = await redis.eval(JOIN_SCRIPT, [key], [playerName, aspirantId]);
    const room   = parseRoom(result);
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });
    return res.status(200).json({ room, aspirantId });
  } catch (err) {
    console.error("join:", err);
    return res.status(500).json({ error: err.message });
  }
}
