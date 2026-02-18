import { Crown, LogIn } from "lucide-react";

const MenuScreen = ({
  playerName,
  setPlayerName,
  roomCode,
  setRoomCode,
  createRoom,
  joinRoom,
  loading,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-4 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Crown className="w-20 h-20 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Verdaderos Reales
          </h1>
          <p className="text-gray-600">¿Qué tan bien te conocen tus amigos?</p>
        </div>

        <input
          type="text"
          placeholder="Tu nombre"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full p-4 border-2 border-gray-300 rounded-xl mb-4 text-lg focus:border-purple-500 focus:outline-none"
        />

        <div className="space-y-3 mb-6">
          <button
            onClick={() => createRoom("generic")}
            disabled={loading}
            className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Crown className="w-6 h-6" />
            Partida Rapida (Preguntas Genéricas)
          </button>
        </div>

        <div className="border-t-2 pt-6">
          <input
            type="text"
            placeholder="Código de sala"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="w-full p-4 border-2 border-gray-300 rounded-xl mb-3 text-lg focus:border-purple-500 focus:outline-none uppercase"
            maxLength={6}
          />
          <button
            onClick={joinRoom}
            disabled={loading}
            className="w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-6 h-6" />
            Unirse A la Sala
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuScreen;