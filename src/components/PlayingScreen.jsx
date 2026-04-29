import { useState } from "react";
import { Check, X } from "lucide-react";
import AdBanner from "./AdBanner";

const STATE_STYLES = {
  correct:   { card: "bg-green-100 border-2 border-green-500",   score: "text-green-600"  },
  incorrect: { card: "bg-red-100 border-2 border-red-500",       score: "text-red-600"    },
  answered:  { card: "bg-blue-100 border-2 border-blue-500",     score: "text-blue-600"   },
  pending:   { card: "bg-purple-100 border-2 border-purple-400", score: "text-purple-600" },
};

function ScoreCard({ name, score, state }) {
  const { card, score: scoreColor } = STATE_STYLES[state];
  return (
    <div className={`p-2 rounded-lg text-center ${card}`}>
      <p className="text-xs font-semibold text-gray-700 truncate">{name}</p>
      <p className={`text-2xl font-bold ${scoreColor}`}>{score}</p>
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
  if (!question) return null;
  if (question.type === "multiple") {
    return (
      <div className="space-y-3">
        {question.options?.map((option) => (
          <button key={option} onClick={() => onSubmit(option)}
            className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold hover:bg-purple-700 active:scale-95 transition-all">
            {option}
          </button>
        ))}
      </div>
    );
  }
  if (question.type === "boolean") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onSubmit("Sí")} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold hover:bg-green-700 active:scale-95 transition-all">Sí / Verdadero</button>
        <button onClick={() => onSubmit("No")} className="w-full bg-red-600 text-white p-4 rounded-xl font-bold hover:bg-red-700 active:scale-95 transition-all">No / Falso</button>
      </div>
    );
  }
  if (question.type === "text") {
    return (
      <div>
        <input type="text" id="textAnswer" placeholder="Escribe tu respuesta"
          className="w-full p-4 border-2 border-gray-300 rounded-xl mb-3 text-lg focus:border-purple-500 focus:outline-none" />
        <button
          onClick={() => { const val = document.getElementById("textAnswer").value.trim(); if (val) onSubmit(val); }}
          className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold hover:bg-purple-700 active:scale-95 transition-all">
          Enviar Respuesta
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

  // Todos los jugadores que compiten: aspirants + admin si no es el líder
  const adminIsKing = currentRoom.admin?.id === currentRoom.king?.id;
  const allPlayers  = [
    ...(currentRoom.aspirants || []),
    ...(!adminIsKing && currentRoom.admin ? [currentRoom.admin] : []),
  ];

  // ── Total correcto según modo ──────────────────────────────────────────────
  const totalQuestions = currentRoom.mode === "custom"
    ? (currentRoom.config?.rounds ?? 10)
    : currentRoom.questions.length;

  const questionProgress = `Pregunta ${currentRoom.currentQuestionIndex + 1}/${totalQuestions}`;

  const myCurrentAnswer  = currentRoom.currentAnswers?.find(
    (a) => a.aspirantName === playerName && String(a.questionId) === String(currentQuestionId)
  );
  const myAlreadyValidated = currentRoom.answeredAspirants?.includes(me?.id);
  const hasAnswered = !!myCurrentAnswer || myAlreadyValidated || answeredQuestions.has(currentRoom.currentQuestionIndex);

  function getState(aspirantId) {
    const record = currentRoom.answers?.[aspirantId]?.find((h) => String(h.questionId) === String(currentQuestionId));
    if (record) return record.isCorrect ? "correct" : "incorrect";
    if (currentRoom.currentAnswers?.some((a) => String(a.aspirantId) === String(aspirantId))) return "answered";
    return "pending";
  }

  function getMyState() {
    const record = currentRoom.answers?.[me?.id]?.find((h) => String(h.questionId) === String(currentQuestionId));
    if (record) return record.isCorrect ? "correct" : "incorrect";
    if (myCurrentAnswer || answeredQuestions.has(currentRoom.currentQuestionIndex)) return "answered";
    return "pending";
  }

  async function handleValidate(aspirantId, isCorrect) {
    if (validating.has(aspirantId)) return;
    setValidating((prev) => new Set(prev).add(aspirantId));
    await validateAnswer(aspirantId, isCorrect);
    setValidating((prev) => { const s = new Set(prev); s.delete(aspirantId); return s; });
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
        </div>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {allPlayers.map((aspirant) => (
            <ScoreCard key={aspirant.id} name={aspirant.name} score={currentRoom.scores?.[aspirant.id] || 0} state={getState(aspirant.id)} />
          ))}
        </div>
        <h3 className="font-bold text-gray-700 mb-3">Respuestas Recibidas:</h3>
        {currentRoom.currentAnswers?.length ? (
          <div className="space-y-3">
            {currentRoom.currentAnswers.map((answer) => (
              <div key={answer.aspirantId} className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 flex justify-between items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-800 truncate">{answer.aspirantName}</p>
                  <p className="text-lg text-gray-700 truncate">{answer.answer}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleValidate(answer.aspirantId, true)} disabled={validating.has(answer.aspirantId)}
                    className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 active:scale-95 transition-all disabled:opacity-50">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleValidate(answer.aspirantId, false)} disabled={validating.has(answer.aspirantId)}
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
      <div className="grid grid-cols-3 gap-2 mb-4">
        {allPlayers.map((aspirant) => (
          <ScoreCard key={aspirant.id} name={aspirant.name} score={currentRoom.scores?.[aspirant.id] || 0}
            state={aspirant.name === playerName ? getMyState() : getState(aspirant.id)} />
        ))}
      </div>
      <div className="bg-purple-100 border-2 border-purple-400 rounded-xl p-4 mb-5">
        <p className="text-xl font-bold text-gray-800 mb-1">{currentQuestion?.text}</p>
        <p className="text-sm text-gray-600">Sobre: {currentRoom.king.name}</p>
      </div>
      {hasAnswered ? (() => {
        const myState = getMyState();
        if (myState === "correct") return (
          <div className="bg-green-100 border-2 border-green-500 rounded-xl p-4 text-center">
            <Check className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="font-bold text-green-700 text-lg">¡Correcto!</p>
            {myCurrentAnswer && <p className="text-gray-700 mt-1">Tu respuesta: <span className="font-semibold">{myCurrentAnswer.answer}</span></p>}
          </div>
        );
        if (myState === "incorrect") return (
          <div className="bg-red-100 border-2 border-red-500 rounded-xl p-4 text-center">
            <X className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <p className="font-bold text-red-700 text-lg">Incorrecto</p>
            {myCurrentAnswer && <p className="text-gray-700 mt-1">Tu respuesta: <span className="font-semibold">{myCurrentAnswer.answer}</span></p>}
          </div>
        );
        return (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 text-center">
            <Check className="w-12 h-12 text-blue-500 mx-auto mb-2" />
            <p className="font-bold text-gray-800">Respuesta Enviada</p>
            {myCurrentAnswer && <p className="text-gray-700 mt-1">Tu respuesta: <span className="font-semibold">{myCurrentAnswer.answer}</span></p>}
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
