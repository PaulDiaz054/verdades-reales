import { useState } from "react";
import { Check, X, CheckCircle } from "lucide-react";
import AdBanner from "./AdBanner";

const MAX_ANSWER_LENGTH = 120;

const STATE_DOT = {
  correct:   "bg-green-500",
  incorrect: "bg-red-500",
  answered:  "bg-blue-500",
  pending:   "bg-gray-300",
};

function Scoreboard({ currentRoom, getState }) {
  const adminIsKing = currentRoom.admin?.id === currentRoom.king?.id;
  const allPlayers  = [
    ...(currentRoom.aspirants || []),
    ...(!adminIsKing && currentRoom.admin ? [currentRoom.admin] : []),
  ];

  const sorted = [...allPlayers].sort(
    (a, b) => (currentRoom.scores?.[b.id] || 0) - (currentRoom.scores?.[a.id] || 0)
  );

  if (!sorted.length) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Puntajes</p>
      <div className="grid grid-cols-2 gap-2">
        {sorted.map((p, i) => {
          const state = getState(p.id);
          return (
            <div key={p.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
              <span className="text-xs text-gray-400 font-bold w-4">#{i + 1}</span>
              <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{p.name}</span>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATE_DOT[state]}`} />
              <span className="text-sm font-bold text-purple-600">{currentRoom.scores?.[p.id] || 0}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnswerHistory({ entries, questions }) {
  if (!entries.length) return null;
  return (
    <div className="mt-5">
      <h3 className="font-bold text-gray-700 mb-3">Mis respuestas anteriores:</h3>
      <div className="space-y-2">
        {entries.map((entry, i) => {
          const question = questions?.find((q) => String(q.id) === String(entry.questionId));
          return (
            <div key={i} className={`rounded-xl p-3 flex justify-between items-center ${entry.isCorrect ? "bg-green-50 border border-green-300" : "bg-red-50 border border-red-300"}`}>
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-xs text-gray-500 truncate">{question?.text}</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{entry.answer || "—"}</p>
              </div>
              {entry.isCorrect ? (
                <div className="flex items-center gap-1 text-green-600 flex-shrink-0">
                  <Check className="w-4 h-4" /><span className="text-xs font-bold">Correcto</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600 flex-shrink-0">
                  <X className="w-4 h-4" /><span className="text-xs font-bold">Incorrecto</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnswerOptions({ question, onSubmit }) {
  const [sending, setSending] = useState(false);
  const [textVal, setTextVal] = useState("");

  async function handleText() {
    const val = textVal.trim();
    if (!val || sending) return;
    setSending(true);
    await onSubmit(val);
    setSending(false);
  }

  async function handleChoice(option) {
    if (sending) return;
    setSending(true);
    await onSubmit(option);
    setSending(false);
  }

  if (!question) return null;

  if (question.type === "multiple") {
    return (
      <div className="space-y-3">
        {question.options?.map((option) => (
          <button key={option}
            onClick={() => handleChoice(option)}
            disabled={sending}
            className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {option}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "boolean") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => handleChoice("Sí")} disabled={sending}
          className="w-full bg-green-600 text-white p-4 rounded-xl font-bold hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50">
          Sí / Verdadero
        </button>
        <button onClick={() => handleChoice("No")} disabled={sending}
          className="w-full bg-red-600 text-white p-4 rounded-xl font-bold hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50">
          No / Falso
        </button>
      </div>
    );
  }

  if (question.type === "text") {
    return (
      <div>
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Escribe tu respuesta"
            value={textVal}
            onChange={(e) => setTextVal(e.target.value.slice(0, MAX_ANSWER_LENGTH))}
            onKeyDown={(e) => { if (e.key === "Enter") handleText(); }}
            maxLength={MAX_ANSWER_LENGTH}
            disabled={sending}
            className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-purple-500 focus:outline-none pr-16 disabled:opacity-50"
          />
          <span className={`absolute right-3 bottom-3 text-xs ${textVal.length >= MAX_ANSWER_LENGTH ? "text-red-400 font-bold" : "text-gray-400"}`}>
            {textVal.length}/{MAX_ANSWER_LENGTH}
          </span>
        </div>
        <button
          onClick={handleText}
          disabled={!textVal.trim() || sending}
          className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {sending ? "Enviando..." : "Enviar Respuesta"}
        </button>
      </div>
    );
  }
  return null;
}

function Screen({ children }) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="w-full p-3"><AdBanner slot="top" /></div>
      <div className="flex-1 w-full p-4 flex flex-col items-center">
        <div className="w-full sm:max-w-2xl bg-white sm:rounded-2xl shadow-xl p-5">
          {children}
        </div>
      </div>
      <div className="w-full p-3"><AdBanner slot="bottom" /></div>
    </div>
  );
}

export default function PlayingScreen({ currentRoom, playerRole, playerName, submitAnswer, validateAnswer, answeredQuestions }) {
  const [validating, setValidating] = useState(new Set());

  const currentQuestion   = currentRoom.questions[currentRoom.currentQuestionIndex];
  const currentQuestionId = currentQuestion?.id;
  const me                = currentRoom.aspirants?.find((a) => a.name === playerName)
                         || (currentRoom.admin?.name === playerName ? currentRoom.admin : null);

  const adminIsKing = currentRoom.admin?.id === currentRoom.king?.id;
  const allPlayers  = [
    ...(currentRoom.aspirants || []),
    ...(!adminIsKing && currentRoom.admin ? [currentRoom.admin] : []),
  ];

  const totalQuestions = currentRoom.mode === "custom"
    ? (currentRoom.config?.rounds ?? 10)
    : currentRoom.questions.length;

  const questionProgress = `Pregunta ${currentRoom.currentQuestionIndex + 1}/${totalQuestions}`;

  // ── Valores de puntuación de esta pregunta ────────────────────────────────
  const globalPoints       = currentRoom.config?.pointsPerAnswer    ?? 1;
  const penaltyEnabled     = currentRoom.config?.penaltyEnabled     ?? false;
  const customPointsActive = currentRoom.config?.customPointsEnabled ?? false;
  const questionPoints     = currentQuestion?.points  ?? globalPoints;
  const questionPenalty    = currentQuestion?.penalty ?? globalPoints;
  const showValueBadge     = customPointsActive || globalPoints !== 1 || penaltyEnabled;

  const myCurrentAnswer    = currentRoom.currentAnswers?.find(
    (a) => a.aspirantName === playerName && String(a.questionId) === String(currentQuestionId)
  );
  const myAlreadyValidated = currentRoom.answeredAspirants?.includes(me?.id);
  const hasAnswered = !!myCurrentAnswer || myAlreadyValidated || answeredQuestions.has(currentRoom.currentQuestionIndex);

  const totalExpected = allPlayers.length;
  const totalAnswered = currentRoom.currentAnswers?.length ?? 0;
  const allAnswered   = totalAnswered >= totalExpected && totalExpected > 0;

  function getState(aspirantId) {
    const record = currentRoom.answers?.[aspirantId]?.find(
      (h) => String(h.questionId) === String(currentQuestionId)
    );
    if (record) return record.isCorrect ? "correct" : "incorrect";
    if (currentRoom.currentAnswers?.some((a) => String(a.aspirantId) === String(aspirantId))) return "answered";
    return "pending";
  }

  function getMyState() {
    const record = currentRoom.answers?.[me?.id]?.find(
      (h) => String(h.questionId) === String(currentQuestionId)
    );
    if (record) return record.isCorrect ? "correct" : "incorrect";
    if (myCurrentAnswer || answeredQuestions.has(currentRoom.currentQuestionIndex)) return "answered";
    return "pending";
  }

  function getStateForBoard(aspirantId) {
    if (aspirantId === me?.id) return getMyState();
    return getState(aspirantId);
  }

  async function handleValidate(aspirantId, isCorrect) {
    if (validating.has(aspirantId)) return;
    setValidating((prev) => new Set(prev).add(aspirantId));
    await validateAnswer(aspirantId, isCorrect);
    setValidating((prev) => { const s = new Set(prev); s.delete(aspirantId); return s; });
  }

  // Badge pills de valor de pregunta
  function ValuePills({ small = false }) {
    if (!showValueBadge) return null;
    const base = small ? "text-xs px-2 py-0.5" : "text-xs px-2 py-1";
    return (
      <div className="flex items-center gap-2 flex-wrap mt-2">
        <span className={`inline-flex items-center bg-purple-100 text-purple-700 font-bold rounded-full ${base}`}>
          +{questionPoints} pt{questionPoints > 1 ? "s" : ""} por acierto
        </span>
        {penaltyEnabled && (
          <span className={`inline-flex items-center bg-red-100 text-red-600 font-bold rounded-full ${base}`}>
            -{questionPenalty} pt{questionPenalty > 1 ? "s" : ""} por fallo
          </span>
        )}
      </div>
    );
  }

  // ── Vista King ─────────────────────────────────────────────────────────────
  if (playerRole === "king") {
    return (
      <Screen>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Vista del Lider</h2>
          <span className="text-purple-600 font-bold">{questionProgress}</span>
        </div>

        <div className="bg-purple-100 border-2 border-purple-400 rounded-xl p-4 mb-4">
          <p className="text-xl font-bold text-gray-800">{currentQuestion?.text}</p>
          <ValuePills />
        </div>

        <Scoreboard currentRoom={currentRoom} getState={getState} />

        {allAnswered ? (
          <div className="flex items-center gap-2 bg-green-50 border-2 border-green-400 rounded-xl p-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="font-bold text-green-700 text-sm">¡Todos respondieron! Valida las respuestas.</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
            <span className="text-sm text-gray-500">
              Esperando respuestas:{" "}
              <span className="font-bold text-gray-700">{totalAnswered}/{totalExpected}</span>
            </span>
          </div>
        )}

        <h3 className="font-bold text-gray-700 mb-3">Respuestas Recibidas:</h3>
        {currentRoom.currentAnswers?.length ? (
          <div className="space-y-3">
            {currentRoom.currentAnswers.map((answer) => (
              <div key={answer.aspirantId} className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 flex justify-between items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-800 truncate">{answer.aspirantName}</p>
                  <p className="text-lg text-gray-700 break-words">{answer.answer}</p>
                  {showValueBadge && (
                    <div className="flex gap-1 mt-1">
                      <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                        +{questionPoints} acierto
                      </span>
                      {penaltyEnabled && (
                        <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                          -{questionPenalty} fallo
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleValidate(answer.aspirantId, true)}
                    disabled={validating.has(answer.aspirantId)}
                    className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 active:scale-95 transition-all disabled:opacity-50">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleValidate(answer.aspirantId, false)}
                    disabled={validating.has(answer.aspirantId)}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">Esperando respuestas...</p>
        )}
      </Screen>
    );
  }

  // ── Vista Aspirante ────────────────────────────────────────────────────────
  const myHistory = currentRoom.answers?.[me?.id] || [];

  return (
    <Screen>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Tu Turno</h2>
        <span className="text-purple-600 font-bold">{questionProgress}</span>
      </div>

      <Scoreboard currentRoom={currentRoom} getState={getStateForBoard} />

      <div className="bg-purple-100 border-2 border-purple-400 rounded-xl p-4 mb-5">
        <p className="text-xl font-bold text-gray-800 mb-1">{currentQuestion?.text}</p>
        <p className="text-sm text-gray-600">Sobre: {currentRoom.king.name}</p>
        <ValuePills />
      </div>

      {hasAnswered ? (() => {
        const myState = getMyState();
        if (myState === "correct") return (
          <div className="bg-green-100 border-2 border-green-500 rounded-xl p-4 text-center">
            <Check className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="font-bold text-green-700 text-lg">¡Correcto!</p>
            {showValueBadge && (
              <p className="text-green-600 font-bold text-sm mt-1">
                +{questionPoints} pt{questionPoints > 1 ? "s" : ""}
              </p>
            )}
            {myCurrentAnswer && (
              <p className="text-gray-700 mt-1">Tu respuesta: <span className="font-semibold">{myCurrentAnswer.answer}</span></p>
            )}
          </div>
        );
        if (myState === "incorrect") return (
          <div className="bg-red-100 border-2 border-red-500 rounded-xl p-4 text-center">
            <X className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <p className="font-bold text-red-700 text-lg">Incorrecto</p>
            {showValueBadge && penaltyEnabled && (
              <p className="text-red-500 font-bold text-sm mt-1">
                -{questionPenalty} pt{questionPenalty > 1 ? "s" : ""}
              </p>
            )}
            {myCurrentAnswer && (
              <p className="text-gray-700 mt-1">Tu respuesta: <span className="font-semibold">{myCurrentAnswer.answer}</span></p>
            )}
          </div>
        );
        return (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 text-center">
            <Check className="w-12 h-12 text-blue-500 mx-auto mb-2" />
            <p className="font-bold text-gray-800">Respuesta Enviada</p>
            {myCurrentAnswer && (
              <p className="text-gray-700 mt-1">Tu respuesta: <span className="font-semibold">{myCurrentAnswer.answer}</span></p>
            )}
            {showValueBadge && (
              <div className="flex justify-center gap-2 mt-2">
                <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded-full">
                  +{questionPoints} si aciertas
                </span>
                {penaltyEnabled && (
                  <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full">
                    -{questionPenalty} si fallas
                  </span>
                )}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2">Esperando validación del Líder...</p>
          </div>
        );
      })() : (
        <AnswerOptions question={currentQuestion} onSubmit={submitAnswer} />
      )}

      <AnswerHistory entries={myHistory} questions={currentRoom.questions} />
    </Screen>
  );
}
