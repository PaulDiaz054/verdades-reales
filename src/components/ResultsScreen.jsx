import { Trophy, Check, X, Clock } from "lucide-react";
import AdBanner from "./AdBanner";

function formatDuration(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return null;
  const seconds = Math.floor((new Date(finishedAt) - new Date(startedAt)) / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export default function ResultsScreen({ currentRoom, resetGame }) {
  if (!currentRoom) return null;

  const duration = formatDuration(currentRoom.startedAt, currentRoom.finishedAt);

  const sorted = Object.entries(currentRoom.scores || {})
    .map(([id, score]) => ({
      aspirant: currentRoom.aspirants?.find((a) => a.id === id),
      score,
      answers: currentRoom.answers?.[id] || [],
    }))
    .sort((a, b) => b.score - a.score);

  const winner = sorted[0];

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-purple-50 to-indigo-100">

      <div className="w-full p-3"><AdBanner slot="top" /></div>

      <div className="flex-1 w-full p-4 flex flex-col items-center overflow-y-auto">
        <div className="w-full sm:max-w-2xl bg-white sm:rounded-2xl shadow-xl p-5">

          <div className="text-center mb-6">
            <Trophy className="w-20 h-20 mx-auto mb-3 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">¡Juego Terminado!</h1>

            {duration && (
              <div className="flex items-center justify-center gap-2 text-gray-500 mt-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Duración de la partida: <span className="font-semibold text-gray-700">{duration}</span></span>
              </div>
            )}

            {winner && (
              <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4 mt-4">
                <p className="text-2xl font-bold text-gray-800 truncate">{winner.aspirant?.name}</p>
                <p className="text-gray-600">¡Es quien mejor conoce al Lider!</p>
                <p className="text-4xl font-bold text-purple-600 mt-2">{winner.score} puntos</p>
              </div>
            )}
          </div>

          <h3 className="font-bold text-gray-700 text-center mb-3">Tabla Final:</h3>
          <div className="space-y-3 mb-5">
            {sorted.map((entry, idx) => (
              <div key={entry.aspirant?.id} className="bg-gray-50 rounded-xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl font-bold text-gray-400 flex-shrink-0">#{idx + 1}</span>
                    <span className="font-semibold text-gray-800 truncate">{entry.aspirant?.name}</span>
                  </div>
                  <span className="text-xl font-bold text-purple-600 flex-shrink-0 ml-2">{entry.score} pts</span>
                </div>
                {entry.answers.length > 0 && (
                  <div className="space-y-1 mt-2 border-t pt-2">
                    {entry.answers.map((a, i) => {
                      const q = currentRoom.questions?.find((q) => String(q.id) === String(a.questionId));
                      return (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {a.isCorrect ? <Check className="w-3 h-3 text-green-500 flex-shrink-0" /> : <X className="w-3 h-3 text-red-500 flex-shrink-0" />}
                          <span className="text-gray-500 truncate">{q?.text}:</span>
                          <span className="font-medium text-gray-700 truncate">{a.answer}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={resetGame}
            className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-purple-700 active:scale-95 transition-all">
            Volver al Menú
          </button>

        </div>
      </div>

      <div className="w-full p-3"><AdBanner slot="bottom" /></div>
    </div>
  );
}