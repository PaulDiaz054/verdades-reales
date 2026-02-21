import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();

const VALIDATE_SCRIPT = `
local key = KEYS[1]
local aspirantId = ARGV[1]
local isCorrect = ARGV[2]

local raw = redis.call('GET', key)
if not raw then return {err = 'NOT_FOUND'} end

local room = cjson.decode(raw)

if room.answeredAspirants then
  for _, id in ipairs(room.answeredAspirants) do
    if tostring(id) == tostring(aspirantId) then
      return cjson.encode(room)
    end
  end
else
  room.answeredAspirants = {}
end

if isCorrect == '1' then
  if not room.scores then room.scores = {} end
  room.scores[aspirantId] = (room.scores[aspirantId] or 0) + 1
end

table.insert(room.answeredAspirants, aspirantId)

local newAnswers = {}
for _, a in ipairs(room.currentAnswers or {}) do
  if tostring(a.aspirantId) ~= tostring(aspirantId) then
    table.insert(newAnswers, a)
  end
end
room.currentAnswers = newAnswers

local totalAspirantes = 0
if room.aspirants then
  for _ in ipairs(room.aspirants) do totalAspirantes = totalAspirantes + 1 end
end
local totalValidados = 0
for _ in ipairs(room.answeredAspirants) do totalValidados = totalValidados + 1 end

if totalValidados >= totalAspirantes then
  room.currentQuestionIndex = tonumber(room.currentQuestionIndex) + 1  -- ✅ forzar número
  room.answeredAspirants = {}
  room.currentAnswers = {}

  local totalPreguntas = 0
  if room.questions then
    for _ in ipairs(room.questions) do totalPreguntas = totalPreguntas + 1 end
  end

  if tonumber(room.currentQuestionIndex) >= totalPreguntas then  -- ✅ forzar número
    room.status = 'finished'
  end
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

  const { roomCode, aspirantId, isCorrect } = req.body;
  if (!roomCode || !aspirantId) return res.status(400).json({ error: "Missing fields" });

  const key = `room_${roomCode.toUpperCase()}`;

  try {
    const result = await redis.eval(VALIDATE_SCRIPT, [key], [aspirantId, isCorrect ? "1" : "0"]);

    if (!result) return res.status(404).json({ error: "Sala no encontrada" });

    const room = typeof result === "string" ? JSON.parse(result) : result;
    return res.status(200).json({ room });
  } catch (error) {
    console.error("Validate error:", error);
    return res.status(500).json({ error: "Error interno: " + error.message });
  }
}
