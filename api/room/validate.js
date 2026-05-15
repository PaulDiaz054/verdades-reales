import { Redis } from "@upstash/redis";
import { setCors, parseRoom } from "./_helpers.js";

const redis = Redis.fromEnv();

const VALIDATE_SCRIPT = `
local key            = KEYS[1]
local aspirantId     = ARGV[1]
local isCorrect      = ARGV[2]
local now            = ARGV[3]
local globalPoints   = tonumber(ARGV[4]) or 1
local penaltyEnabled = ARGV[5]
local globalPenalty  = tonumber(ARGV[6]) or globalPoints

local raw = redis.call('GET', key)
if not raw then return {err = 'NOT_FOUND'} end

local room = cjson.decode(raw)

if not room.answeredAspirants then room.answeredAspirants = {} end
for _, id in ipairs(room.answeredAspirants) do
  if tostring(id) == tostring(aspirantId) then return cjson.encode(room) end
end

-- Leer puntos de la pregunta actual (pueden sobreescribir el global)
local currentQ = nil
local qIndex = tonumber(room.currentQuestionIndex) or 0
if room.questions and room.questions[qIndex + 1] then
  currentQ = room.questions[qIndex + 1]
end

local pointsToUse  = globalPoints
local penaltyToUse = globalPenalty
if currentQ then
  if currentQ.points  then pointsToUse  = tonumber(currentQ.points)  or globalPoints  end
  if currentQ.penalty then penaltyToUse = tonumber(currentQ.penalty) or globalPenalty end
end

if not room.scores then room.scores = {} end

if isCorrect == '1' then
  room.scores[aspirantId] = (room.scores[aspirantId] or 0) + pointsToUse
else
  if penaltyEnabled == '1' and penaltyToUse > 0 then
    local current  = room.scores[aspirantId] or 0
    room.scores[aspirantId] = current - penaltyToUse
  end
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
      points     = isCorrect == '1' and pointsToUse or 0,
      penalty    = isCorrect ~= '1' and penaltyToUse or 0,
    })
  end
end
room.currentAnswers = remaining

-- Garantizar entradas en scores para todos los jugadores
for _, a in ipairs(room.aspirants or {}) do
  if room.scores[a.id] == nil then room.scores[a.id] = 0 end
end
local adminIsKing = room.admin and room.king and (tostring(room.admin.id) == tostring(room.king.id))
if room.admin and not adminIsKing then
  if room.scores[room.admin.id] == nil then room.scores[room.admin.id] = 0 end
end

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

  const {
    roomCode,
    aspirantId,
    isCorrect,
    pointsPerAnswer = 1,
    penaltyEnabled  = false,
  } = req.body;

  if (!roomCode || !aspirantId)
    return res.status(400).json({ error: "Missing fields" });

  const key = `room_${roomCode.toUpperCase()}`;
  const now = new Date().toISOString();

  try {
    const result = await redis.eval(
      VALIDATE_SCRIPT,
      [key],
      [
        aspirantId,
        isCorrect ? "1" : "0",
        now,
        String(pointsPerAnswer),
        penaltyEnabled ? "1" : "0",
        String(pointsPerAnswer), // globalPenalty = mismo valor que globalPoints por defecto
      ],
    );
    const room = parseRoom(result);
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });
    return res.status(200).json({ room });
  } catch (err) {
    console.error("validate:", err);
    return res.status(500).json({ error: err.message });
  }
}
