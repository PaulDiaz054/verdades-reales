import { X, Settings } from "lucide-react";
import { useState } from "react";

const ROUNDS_OPTIONS = [5, 10, 15, 20];
const POINTS_OPTIONS = [1, 2, 3, 5];

export default function GameConfigModal({ config, onClose, onSave }) {
  const [local, setLocal] = useState({ ...config });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">

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

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Número de rondas
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ROUNDS_OPTIONS.map((n) => (
              <button key={n}
                onClick={() => setLocal((p) => ({ ...p, rounds: n }))}
                className={`p-3 rounded-xl font-bold text-lg transition-all border-0 active:scale-95
                  ${local.rounds === n
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-purple-100"}`}>
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Se elegirán {local.rounds} preguntas al azar</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Puntos por respuesta correcta
          </label>
          <div className="grid grid-cols-4 gap-2">
            {POINTS_OPTIONS.map((n) => (
              <button key={n}
                onClick={() => setLocal((p) => ({ ...p, pointsPerAnswer: n }))}
                className={`p-3 rounded-xl font-bold text-lg transition-all border-0 active:scale-95
                  ${local.pointsPerAnswer === n
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-purple-100"}`}>
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Cada acierto suma {local.pointsPerAnswer} punto{local.pointsPerAnswer > 1 ? "s" : ""}</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-5">
          <p className="text-sm text-purple-800 font-medium text-center">
            Partida de <span className="font-bold">{local.rounds} rondas</span> · {local.pointsPerAnswer} pto{local.pointsPerAnswer > 1 ? "s" : ""} por acierto · Máximo <span className="font-bold">{local.rounds * local.pointsPerAnswer} pts</span>
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
