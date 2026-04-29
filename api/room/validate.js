import { Redis } from "@upstash/redis";
import { setCors, parseRoom } from "./_helpers.js";

const redis = Redis.fromEnv();

const VALIDATE_SCRIPT = `
local key             = KEYS[1]
local aspirantId      = ARGV[1]
local isCorrect       = ARGV[2]
local now             = ARGV[3]
local pointsPerAnswer = tonumber(ARGV[4]) or 1

local raw = redis.call('GET', key)
if not raw then return {err = 'NOT_FOUND'} end

local room = cjson.decode(raw)

if not room.answeredAspirants then room.answeredAspirants = {} end
for _, id in ipairs(room.answeredAspirants) do
  if tostring(id) == tostring(aspirantId) then return cjson.encode(room) end
end

if isCorrect == '1' then
  if not room.scores then room.scores = {} end
  room.scores[aspirantId] = (room.scores[aspirantId] or 0) + pointsPerAnswer
end

table.insert(room.answeredAspirants, aspirantId)

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

-- Asegurar que todos los jugadores tienen entrada en scores (aunque sea 0)
-- para que aparezcan en la tabla de resultados
if not room.scores then room.scores = {} end
for _, a in ipairs(room.aspirants or {}) do
  if room.scores[a.id] == nil then room.scores[a.id] = 0 end
end
local adminIsKing = room.admin and room.king and (tostring(room.admin.id) == tostring(room.king.id))
if room.admin and not adminIsKing then
  if room.scores[room.admin.id] == nil then room.scores[room.admin.id] = 0 end
end

-- Total real de jugadores que responden:
-- aspirants + el admin si NO es el lider
local total = room.aspirants and #room.aspirants or 0
if room.admin and not adminIsKing then
  total = total + 1
end

local validated = #room.answeredAspirants

if validated >= total then
  room.currentQuestionIndex = tonumber(room.currentQuestionIndex) + 1
  room.answeredAspirants    = {}
  room.currentAnswers       = {}

  local totalQ
  if room.mode == 'custom' then
    totalQ = (room.config and tonumber(room.config.rounds)) or 10
  else
    totalQ = room.questions and #room.questions or 0
  end

  if tonumber(room.currentQuestionIndex) >= totalQ then
    room.status     = 'finished'
    room.finishedAt = now
  else
    if room.mode == 'custom' then
      room.status = 'waiting_question'
    end
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

  const { roomCode, aspirantId, isCorrect, pointsPerAnswer = 1 } = req.body;
  if (!roomCode || !aspirantId)
    return res.status(400).json({ error: "Missing fields" });

  const key = `room_${roomCode.toUpperCase()}`;
  const now = new Date().toISOString();

  try {
    const result = await redis.eval(
      VALIDATE_SCRIPT,
      [key],
      [aspirantId, isCorrect ? "1" : "0", now, String(pointsPerAnswer)],
    );
    const room = parseRoom(result);
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });
    return res.status(200).json({ room });
  } catch (err) {
    console.error("validate:", err);
    return res.status(500).json({ error: err.message });
  }
}
