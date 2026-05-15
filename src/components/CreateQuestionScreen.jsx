import { useState } from "react";
import { Plus, X, Send, Zap } from "lucide-react";
import AdBanner from "./AdBanner";

const MAX_QUESTION_LENGTH = 200;
const MAX_OPTION_LENGTH   = 80;

const TYPES = [
  { value: "text",     label: "Texto libre" },
  { value: "boolean",  label: "Sí / No" },
  { value: "multiple", label: "Opción múltiple" },
];

function Scoreboard({ currentRoom }) {
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
        {sorted.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
            <span className="text-xs text-gray-400 font-bold w-4">#{i + 1}</span>
            <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{p.name}</span>
            <span className="text-sm font-bold text-purple-600">{currentRoom.scores?.[p.id] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CreateQuestionScreen({ currentRoom, playerName, submitCustomQuestion }) {
  const defaultPoints  = currentRoom?.config?.pointsPerAnswer ?? 1;
  const penaltyEnabled = currentRoom?.config?.penaltyEnabled  ?? false;
  const defaultPenalty = defaultPoints; // misma magnitud que los puntos por defecto

  const [text, setText]         = useState("");
  const [type, setType]         = useState("text");
  const [options, setOptions]   = useState(["", ""]);
  const [points, setPoints]     = useState(defaultPoints);
  const [penalty, setPenalty]   = useState(defaultPenalty);
  const [sending, setSending]   = useState(false);

  const roundNum    = (currentRoom?.currentQuestionIndex ?? 0) + 1;
  const totalRounds = currentRoom?.config?.rounds ?? 10;

  function addOption() {
    if (options.length < 6) setOptions([...options, ""]);
  }

  function removeOption(i) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  }

  function updateOption(i, val) {
    const next = [...options];
    next[i] = val.slice(0, MAX_OPTION_LENGTH);
    setOptions(next);
  }

  async function handleSend() {
    if (!text.trim() || sending) return;
    if (type === "multiple" && options.filter(o => o.trim()).length < 2) return;
    setSending(true);
    const question = {
      id: Date.now(),
      text: text.trim(),
      type,
      options:  type === "multiple" ? options.filter(o => o.trim()) : undefined,
      points,
      penalty:  penaltyEnabled ? penalty : 0,
    };
    await submitCustomQuestion(question);
    setSending(false);
  }

  const multipleValid = type !== "multiple" || options.filter(o => o.trim()).length >= 2;
  const canSend = text.trim().length > 0 && multipleValid && !sending;

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="w-full p-3"><AdBanner slot="top" /></div>

      <div className="flex-1 w-full p-4 flex flex-col items-center">
        <div className="w-full sm:max-w-2xl bg-white sm:rounded-2xl shadow-xl p-5">

          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold text-gray-800">Crear Pregunta</h2>
            <span className="text-purple-600 font-bold">Ronda {roundNum}/{totalRounds}</span>
          </div>

          <Scoreboard currentRoom={currentRoom} />

          {/* Tipo */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de pregunta</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button key={t.value}
                  onClick={() => setType(t.value)}
                  className={`p-3 rounded-xl font-semibold text-sm transition-all border-0 active:scale-95
                    ${type === t.value
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-purple-100"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Texto de la pregunta */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Pregunta</label>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Escribe la pregunta sobre ti..."
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
                maxLength={MAX_QUESTION_LENGTH}
                className="w-full p-4 pb-7 border-2 border-gray-300 rounded-xl text-lg focus:border-purple-500 focus:outline-none resize-none"
              />
              <span className={`absolute right-3 bottom-2 text-xs ${text.length >= MAX_QUESTION_LENGTH ? "text-red-400 font-bold" : "text-gray-400"}`}>
                {text.length}/{MAX_QUESTION_LENGTH}
              </span>
            </div>
          </div>

          {/* Opciones múltiple */}
          {type === "multiple" && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Opciones de respuesta</label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder={`Opción ${i + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        maxLength={MAX_OPTION_LENGTH}
                        className="w-full p-3 pr-14 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${opt.length >= MAX_OPTION_LENGTH ? "text-red-400 font-bold" : "text-gray-400"}`}>
                        {opt.length}/{MAX_OPTION_LENGTH}
                      </span>
                    </div>
                    <button onClick={() => removeOption(i)}
                      disabled={options.length <= 2}
                      className="p-2 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 disabled:opacity-30 border-0 active:scale-95 transition-all flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <button onClick={addOption}
                  className="mt-2 flex items-center gap-1 text-sm text-purple-600 font-semibold hover:text-purple-800 border-0 bg-transparent active:scale-95 transition-all">
                  <Plus className="w-4 h-4" /> Agregar opción
                </button>
              )}
            </div>
          )}

          {/* Puntuación de esta pregunta */}
          <div className={`rounded-xl border-2 p-4 mb-4 ${penaltyEnabled ? "border-gray-200 bg-gray-50" : "border-purple-100 bg-purple-50"}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Puntuación de esta pregunta</p>

            {/* Puntos por acierto */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-gray-700">Puntos por acierto</label>
                <span className="text-xl font-bold text-purple-600">{points}</span>
              </div>
              <input
                type="range" min={1} max={10} step={1}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "#7c3aed" }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>1</span>
                <span className="text-gray-400">por defecto: {defaultPoints}</span>
                <span>10</span>
              </div>
            </div>

            {/* Puntos de castigo — solo si está habilitado globalmente */}
            {penaltyEnabled && (
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-red-500" /> Puntos de castigo
                  </label>
                  <span className="text-xl font-bold text-red-500">{penalty}</span>
                </div>
                <input
                  type="range" min={1} max={10} step={1}
                  value={penalty}
                  onChange={(e) => setPenalty(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: "#ef4444" }}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>1</span>
                  <span className="text-gray-400">por defecto: {defaultPenalty}</span>
                  <span>10</span>
                </div>
              </div>
            )}
          </div>

          {/* Resumen de la pregunta */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 mb-4 flex items-center justify-center gap-3 text-sm">
            <span className="text-green-600 font-bold">+{points} acierto</span>
            {penaltyEnabled && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-red-500 font-bold">-{penalty} fallo</span>
              </>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={!canSend}
            className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-0">
            <Send className="w-5 h-5" />
            {sending ? "Enviando..." : "Enviar pregunta"}
          </button>

        </div>
      </div>

      <div className="w-full p-3"><AdBanner slot="bottom" /></div>
    </div>
  );
}