import { Redis } from "@upstash/redis";
import { setCors, parseRoom } from "./_helpers.js";

const redis = Redis.fromEnv();

// Idempotente: reemplaza si ya existe respuesta para el mismo aspirante
const ANSWER_SCRIPT = `
local key         = KEYS[1]
local aspirantId  = ARGV[1]
local aspirantName= ARGV[2]
local questionId  = ARGV[3]
local answer      = ARGV[4]

local raw = redis.call('GET', key)
if not raw then return {err = 'NOT_FOUND'} end

local room = cjson.decode(raw)

-- Si ya fue validado, ignorar
if room.answeredAspirants then
  for _, id in ipairs(room.answeredAspirants) do
    if id == aspirantId then return cjson.encode(room) end
  end
end

if not room.currentAnswers then room.currentAnswers = {} end

local entry = { aspirantId = aspirantId, aspirantName = aspirantName,
                questionId = questionId, answer = answer }

local replaced = false
for i, a in ipairs(room.currentAnswers) do
  if a.aspirantId == aspirantId then
    room.currentAnswers[i] = entry
    replaced = true
    break
  end
end
if not replaced then
  table.insert(room.currentAnswers, entry)
end

redis.call('SET', key, cjson.encode(room), 'EX', 86400)
return cjson.encode(room)
`;

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { roomCode, aspirantId, aspirantName, questionId, answer } = req.body;
  if (!roomCode || !aspirantId || !answer)
    return res.status(400).json({ error: "Missing fields" });

  const key = `room_${roomCode.toUpperCase()}`;

  try {
    const result = await redis.eval(ANSWER_SCRIPT, [key], [aspirantId, aspirantName, questionId, answer]);
    const room = parseRoom(result);
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });
    return res.status(200).json({ room });
  } catch (err) {
    console.error("answer:", err);
    return res.status(500).json({ error: err.message });
  }
}
