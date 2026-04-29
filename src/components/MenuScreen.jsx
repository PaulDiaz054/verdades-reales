import { Crown, LogIn } from "lucide-react";
import AdBanner from "./AdBanner";

export default function MenuScreen({ playerName, setPlayerName, roomCode, setRoomCode, createRoom, joinRoom, loading }) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-purple-50 to-indigo-100">

      <div className="w-full p-3"><AdBanner slot="top" /></div>

      <div className="flex-1 w-full p-4 flex flex-col items-center">
        <div className="w-full sm:max-w-2xl bg-white sm:rounded-2xl shadow-xl p-5">
          <div className="text-center mb-6">
            <Crown className="w-16 h-16 mx-auto mb-3 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Verdaderos Reales</h1>
            <p className="text-gray-600">¿Qué tan bien te conocen tus amigos?</p>
          </div>

          <input
            type="text"
            placeholder="Tu nombre"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-4 border-2 border-gray-300 rounded-xl mb-4 text-lg focus:border-purple-500 focus:outline-none"
          />

          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-5"
          >
            <Crown className="w-6 h-6 flex-shrink-0" />
            Crear Sala
          </button>

          <div className="border-t-2 pt-5">
            <input
              type="text"
              placeholder="Código de sala"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full p-4 border-2 border-gray-300 rounded-xl mb-3 text-lg focus:border-purple-500 focus:outline-none uppercase tracking-widest"
              maxLength={6}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-6 h-6 flex-shrink-0" />
              Unirse a la Sala
            </button>
          </div>
        </div>
      </div>

      <div className="w-full p-3"><AdBanner slot="bottom" /></div>
    </div>
  );
}
