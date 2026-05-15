import { X, Settings, Zap, Star } from "lucide-react";
import { useState } from "react";

const MODE_OPTIONS = [
  { value: "generic", label: "Preguntas Genéricas", desc: "Se usan preguntas predefinidas al azar" },
  { value: "custom",  label: "Modo Personalizado",  desc: "El King escribe cada pregunta en vivo" },
];

function Toggle({ enabled, onClick, color = "purple" }) {
  const bg = enabled
    ? color === "red" ? "bg-red-500" : "bg-purple-600"
    : "bg-gray-300";
  return (
    <div onClick={onClick}
      className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative cursor-pointer ${bg}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${enabled ? "left-5" : "left-0.5"}`} />
    </div>
  );
}

export default function GameConfigModal({ config, onClose, onSave }) {
  const [local, setLocal] = useState({
    penaltyEnabled: false,
    customPointsEnabled: false,
    ...config,
  });

  const isCustomMode = local.mode === "custom";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-800">Configuración de Partida</h2>
          </div>
          <button onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 active:scale-95 transition-all border-0">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Modo de juego */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Modo de juego</label>
          <div className="space-y-2">
            {MODE_OPTIONS.map((m) => (
              <button key={m.value}
                onClick={() => setLocal((p) => ({ ...p, mode: m.value }))}
                className={`w-full p-3 rounded-xl text-left transition-all border-2 active:scale-95
                  ${local.mode === m.value
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 bg-gray-50 hover:border-purple-300"}`}>
                <p className={`font-bold text-sm ${local.mode === m.value ? "text-purple-700" : "text-gray-700"}`}>{m.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Rondas — slider */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-gray-700">Número de rondas</label>
            <span className="text-2xl font-bold text-purple-600 leading-none">{local.rounds}</span>
          </div>
          <input
            type="range" min={2} max={20} step={1}
            value={local.rounds}
            onChange={(e) => setLocal((p) => ({ ...p, rounds: Number(e.target.value) }))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: "#7c3aed" }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>2</span>
            <span className="text-gray-500">
              {isCustomMode
                ? `El King escribirá ${local.rounds} preguntas`
                : `Se elegirán ${local.rounds} preguntas al azar`}
            </span>
            <span>20</span>
          </div>
        </div>

        {/* Puntos por acierto — slider (solo si customPoints no está activo) */}
        {!local.customPointsEnabled && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-700">Puntos por respuesta correcta</label>
              <span className="text-2xl font-bold text-purple-600 leading-none">{local.pointsPerAnswer}</span>
            </div>
            <input
              type="range" min={1} max={10} step={1}
              value={local.pointsPerAnswer}
              onChange={(e) => setLocal((p) => ({ ...p, pointsPerAnswer: Number(e.target.value) }))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: "#7c3aed" }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span>
              <span className="text-gray-500">Cada acierto suma {local.pointsPerAnswer} punto{local.pointsPerAnswer > 1 ? "s" : ""}</span>
              <span>10</span>
            </div>
          </div>
        )}

        {/* Puntuación por pregunta — solo en modo custom */}
        {isCustomMode && (
          <div className="mb-6">
            <div
              onClick={() => setLocal((p) => ({ ...p, customPointsEnabled: !p.customPointsEnabled }))}
              className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all select-none
                ${local.customPointsEnabled
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 bg-gray-50 hover:border-purple-300"}`}>
              <div className="flex items-center gap-3">
                <Star className={`w-5 h-5 flex-shrink-0 ${local.customPointsEnabled ? "text-purple-500" : "text-gray-400"}`} />
                <div>
                  <p className={`font-bold text-sm ${local.customPointsEnabled ? "text-purple-700" : "text-gray-700"}`}>
                    Puntuación por pregunta
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    El King define cuánto vale cada pregunta al crearla
                  </p>
                </div>
              </div>
              <Toggle
                enabled={local.customPointsEnabled}
                onClick={() => setLocal((p) => ({ ...p, customPointsEnabled: !p.customPointsEnabled }))}
              />
            </div>
            {local.customPointsEnabled && (
              <p className="text-xs text-purple-600 mt-2 px-1">
                El valor por defecto de cada pregunta será <span className="font-bold">{local.pointsPerAnswer} pt{local.pointsPerAnswer > 1 ? "s" : ""}</span>. El King podrá cambiarlo al crear cada pregunta.
              </p>
            )}
          </div>
        )}

        {/* Castigo — toggle */}
        <div className="mb-6">
          <div
            onClick={() => setLocal((p) => ({ ...p, penaltyEnabled: !p.penaltyEnabled }))}
            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all select-none
              ${local.penaltyEnabled
                ? "border-red-400 bg-red-50"
                : "border-gray-200 bg-gray-50 hover:border-red-300"}`}>
            <div className="flex items-center gap-3">
              <Zap className={`w-5 h-5 flex-shrink-0 ${local.penaltyEnabled ? "text-red-500" : "text-gray-400"}`} />
              <div>
                <p className={`font-bold text-sm ${local.penaltyEnabled ? "text-red-700" : "text-gray-700"}`}>
                  Castigo por fallo
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {local.customPointsEnabled
                    ? "Responder mal resta los puntos definidos en cada pregunta"
                    : `Responder mal resta ${local.pointsPerAnswer} punto${local.pointsPerAnswer > 1 ? "s" : ""} (igual que el acierto)`}
                </p>
              </div>
            </div>
            <Toggle enabled={local.penaltyEnabled} color="red"
              onClick={() => setLocal((p) => ({ ...p, penaltyEnabled: !p.penaltyEnabled }))} />
          </div>
        </div>

        {/* Resumen */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-5">
          <p className="text-sm text-purple-800 font-medium text-center">
            {isCustomMode ? "Personalizado" : "Genérico"} ·{" "}
            <span className="font-bold">{local.rounds} rondas</span>
            {local.customPointsEnabled
              ? <span> · puntos <span className="font-bold">por pregunta</span></span>
              : <> · +{local.pointsPerAnswer} por acierto</>
            }
            {local.penaltyEnabled && !local.customPointsEnabled && (
              <span className="text-red-600"> · -{local.pointsPerAnswer} por fallo</span>
            )}
            {local.penaltyEnabled && local.customPointsEnabled && (
              <span className="text-red-600"> · castigo activo</span>
            )}
            {!local.customPointsEnabled && (
              <> · Máximo <span className="font-bold">{local.rounds * local.pointsPerAnswer} pts</span></>
            )}
          </p>
        </div>

        <button onClick={() => onSave(local)}
          className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-purple-700 active:scale-95 transition-all border-0">
          Guardar configuración
        </button>

      </div>
    </div>
  );
}