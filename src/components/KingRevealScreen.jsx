import { Crown, Play } from "lucide-react";
import AdBanner from "./AdBanner";

export default function KingRevealScreen({ currentRoom, playerRole, playerName, confirmKingAndStart }) {
  const king    = currentRoom?.king;
  const isAdmin = playerRole === "admin" || playerRole === "admin_king";
  const isKing  = king?.name === playerName;

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="w-full p-3"><AdBanner slot="top" /></div>

      <div className="flex-1 w-full p-4 flex flex-col items-center justify-center">
        <div className="w-full sm:max-w-2xl bg-white sm:rounded-2xl shadow-xl p-8 text-center">

          <Crown className="w-20 h-20 mx-auto mb-4 text-yellow-500" />

          <p className="text-gray-500 text-sm mb-2 uppercase tracking-widest font-semibold">El Líder es</p>
          <h2 className="text-4xl font-bold text-gray-800 mb-2">{king?.name}</h2>

          {isKing && (
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-3 mt-3 mb-4">
              <p className="text-yellow-800 font-semibold">¡Eres el Líder! Las preguntas son sobre ti 👑</p>
            </div>
          )}

          {!isKing && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 mt-3 mb-4">
              <p className="text-purple-700 font-semibold">Las preguntas serán sobre {king?.name}</p>
            </div>
          )}

          {isAdmin ? (
            <button
              onClick={confirmKingAndStart}
              className="w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2 border-0 mt-4">
              <Play className="w-5 h-5" />
              Iniciar Partida
            </button>
          ) : (
            <p className="text-gray-400 text-sm animate-pulse mt-4">
              Esperando que el administrador inicie...
            </p>
          )}

        </div>
      </div>

      <div className="w-full p-3"><AdBanner slot="bottom" /></div>
    </div>
  );
}
