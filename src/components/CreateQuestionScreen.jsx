import { useState } from "react";
import { Plus, X, Send } from "lucide-react";
import AdBanner from "./AdBanner";

const TYPES = [
  { value: "text",     label: "Texto libre" },
  { value: "boolean",  label: "Sí / No" },
  { value: "multiple", label: "Opción múltiple" },
];

export default function CreateQuestionScreen({ currentRoom, playerName, submitCustomQuestion }) {
  const [text, setText]       = useState("");
  const [type, setType]       = useState("text");
  const [options, setOptions] = useState(["", ""]);
  const [sending, setSending] = useState(false);

  const roundNum = (currentRoom?.currentQuestionIndex ?? 0) + 1;
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
    next[i] = val;
    setOptions(next);
  }

  async function handleSend() {
    if (!text.trim()) return;
    if (type === "multiple" && options.filter(o => o.trim()).length < 2) return;
    setSending(true);
    const question = {
      id: Date.now(),
      text: text.trim(),
      type,
      options: type === "multiple" ? options.filter(o => o.trim()) : undefined,
    };
    await submitCustomQuestion(question);
    setSending(false);
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="w-full p-3"><AdBanner slot="top" /></div>

      <div className="flex-1 w-full p-4 flex flex-col items-center">
        <div className="w-full sm:max-w-2xl bg-white sm:rounded-2xl shadow-xl p-5">

          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold text-gray-800">Crear Pregunta</h2>
            <span className="text-purple-600 font-bold">Ronda {roundNum}/{totalRounds}</span>
          </div>

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

          {/* Texto */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Pregunta</label>
            <textarea
              rows={3}
              placeholder="Escribe la pregunta sobre ti..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          {/* Opciones múltiple */}
          {type === "multiple" && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Opciones de respuesta</label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder={`Opción ${i + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      className="flex-1 p-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                    <button onClick={() => removeOption(i)}
                      disabled={options.length <= 2}
                      className="p-2 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 disabled:opacity-30 border-0 active:scale-95 transition-all">
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

          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-0">
            <Send className="w-5 h-5" />
            {sending ? "Enviando..." : "Enviar pregunta"}
          </button>

        </div>
      </div>

      <div className="w-full p-3"><AdBanner slot="bottom" /></div>
    </div>
  );
}
