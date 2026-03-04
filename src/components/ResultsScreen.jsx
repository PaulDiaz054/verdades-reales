import { Trophy, Check, X } from "lucide-react";

export default function ResultsScreen({ currentRoom, resetGame }) {
  if (!currentRoom) return null;

  const sorted = Object.entries(currentRoom.scores || {})
    .map(([id, score]) => ({
      aspirant: currentRoom.aspirants?.find((a) => a.id === id),
      score,
      answers: currentRoom.answers?.[id] || [],
    }))
    .sort((a, b) => b.score - a.score);

  const winner = sorted[0];

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Trophy className="w-24 h-24 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">¡Juego Terminado!</h1>
          {winner && (
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4 mt-4">
              <p className="text-2xl font-bold text-gray-800">{winner.aspirant?.name}</p>
              <p className="text-gray-600">¡Es quien mejor conoce al Lider!</p>
              <p className="text-4xl font-bold text-purple-600 mt-2">{winner.score} puntos</p>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <h3 className="font-bold text-gray-700 text-center">Tabla Final:</h3>
          {sorted.map((entry, idx) => (
            <div key={entry.aspirant?.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">#{idx + 1}</span>
                  <span className="font-semibold text-gray-800">{entry.aspirant?.name}</span>
                </div>
                <span className="text-xl font-bold text-purple-600">{entry.score} pts</span>
              </div>

              {entry.answers.length > 0 && (
                <div className="space-y-1 mt-2 border-t pt-2">
                  {entry.answers.map((a, i) => {
                    const q = currentRoom.questions?.find(
                      (q) => String(q.id) === String(a.questionId)
                    );
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {a.isCorrect
                          ? <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                          : <X className="w-3 h-3 text-red-500 flex-shrink-0" />}
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

        <button
          onClick={resetGame}
          className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition"
        >
          Volver al Menú
        </button>
      </div>
    </div>
  );
}
