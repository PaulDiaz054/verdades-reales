import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();

const ANSWER_SCRIPT = `
local key = KEYS[1]
local aspirantId = ARGV[1]
local aspirantName = ARGV[2]
local questionId = ARGV[3]
local answer = ARGV[4]
local timestamp = ARGV[5]

local raw = redis.call('GET', key)
if not raw then return {err = 'NOT_FOUND'} end

local room = cjson.decode(raw)

-- Idempotente: si ya fue validado, no hacer nada
if room.answeredAspirants then
  for _, id in ipairs(room.answeredAspirants) do
    if id == aspirantId then
      return cjson.encode(room)
    end
  end
end

if not room.currentAnswers then room.currentAnswers = {} end

-- Buscar si ya tiene respuesta y reemplazar, si no agregar
local found = false
for i, a in ipairs(room.currentAnswers) do
  if a.aspirantId == aspirantId then
    room.currentAnswers[i] = {
      aspirantId = aspirantId,
      aspirantName = aspirantName,
      questionId = questionId,
      answer = answer,
      timestamp = tonumber(timestamp)
    }
    found = true
    break
  end
end

if not found then
  table.insert(room.currentAnswers, {
    aspirantId = aspirantId,
    aspirantName = aspirantName,
    questionId = questionId,
    answer = answer,
    timestamp = tonumber(timestamp)
  })
end

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

  const { roomCode, aspirantId, aspirantName, questionId, answer } = req.body;
  if (!roomCode || !aspirantId || !answer) return res.status(400).json({ error: "Missing fields" });

  const key = `room_${roomCode.toUpperCase()}`;

  try {
    const result = await redis.eval(ANSWER_SCRIPT, [key], [aspirantId, aspirantName, questionId, answer, Date.now().toString()]);

    if (!result) return res.status(404).json({ error: "Sala no encontrada" });

    const room = typeof result === "string" ? JSON.parse(result) : result;
    return res.status(200).json({ room });
  } catch (error) {
    console.error("Answer error:", error);
    return res.status(500).json({ error: "Error interno: " + error.message });
  }
}
