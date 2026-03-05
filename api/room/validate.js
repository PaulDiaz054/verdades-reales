import { Redis } from "@upstash/redis";
import { setCors, parseRoom } from "./_helpers.js";

const redis = Redis.fromEnv();

const VALIDATE_SCRIPT = `
local key        = KEYS[1]
local aspirantId = ARGV[1]
local isCorrect  = ARGV[2]
local now        = ARGV[3]

local raw = redis.call('GET', key)
if not raw then return {err = 'NOT_FOUND'} end

local room = cjson.decode(raw)

-- Idempotente
if not room.answeredAspirants then room.answeredAspirants = {} end
for _, id in ipairs(room.answeredAspirants) do
  if tostring(id) == tostring(aspirantId) then return cjson.encode(room) end
end

-- Actualizar score
if isCorrect == '1' then
  if not room.scores then room.scores = {} end
  room.scores[aspirantId] = (room.scores[aspirantId] or 0) + 1
end

table.insert(room.answeredAspirants, aspirantId)

-- Mover respuesta de currentAnswers → answers[aspirantId]
if not room.answers then room.answers = {} end
if not room.answers[aspirantId] then room.answers[aspirantId] = {} end

local remaining = {}
for _, a in ipairs(room.currentAnswers or {}) do
  if tostring(a.aspirantId) ~= tostring(aspirantId) then
    table.insert(remaining, a)
  else
    table.insert(room.answers[aspirantId], {
      questionId = a.questionId,
      answer     = a.answer,
      isCorrect  = (isCorrect == '1'),
    })
  end
end
room.currentAnswers = remaining

-- Avanzar pregunta si todos fueron validados
local total     = room.aspirants and #room.aspirants or 0
local validated = #room.answeredAspirants

if validated >= total then
  room.currentQuestionIndex = tonumber(room.currentQuestionIndex) + 1
  room.answeredAspirants    = {}
  room.currentAnswers       = {}

  local totalQ = room.questions and #room.questions or 0
  if tonumber(room.currentQuestionIndex) >= totalQ then
    room.status     = 'finished'
    room.finishedAt = now   -- fecha y hora de fin
  end
end

redis.call('SET', key, cjson.encode(room), 'EX', 86400)
return cjson.encode(room)
`;

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { roomCode, aspirantId, isCorrect } = req.body;
  if (!roomCode || !aspirantId)
    return res.status(400).json({ error: "Missing fields" });

  const key = `room_${roomCode.toUpperCase()}`;
  const now = new Date().toISOString(); // timestamp de fin generado en Node.js

  try {
    const result = await redis.eval(
      VALIDATE_SCRIPT,
      [key],
      [aspirantId, isCorrect ? "1" : "0", now],
    );
    const room = parseRoom(result);
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });
    return res.status(200).json({ room });
  } catch (err) {
    console.error("validate:", err);
    return res.status(500).json({ error: err.message });
  }
}
