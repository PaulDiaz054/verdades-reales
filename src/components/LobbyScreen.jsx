import { Crown, Users, Play } from "lucide-react";

const LobbyScreen = ({ roomCode, playerRole, currentRoom, startGame }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Sala de Espera
          </h2>
          <div className="bg-gray-100 rounded-xl p-4 inline-block">
            <p className="text-sm text-gray-600">Código de Sala</p>
            <p className="text-4xl font-bold text-purple-600">{roomCode}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-bold text-gray-800">El lider</p>
                <p className="text-gray-700">{currentRoom?.king?.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-100 border-2 border-blue-400 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-6 h-6 text-blue-600" />
              <p className="font-bold text-gray-800">
                Reales ({currentRoom?.aspirants?.length || 0})
              </p>
            </div>
            <div className="space-y-2">
              {currentRoom?.aspirants?.map((aspirant) => (
                <div key={aspirant.id} className="bg-white p-2 rounded-lg">
                  <p className="text-gray-700">{aspirant.name}</p>
                </div>
              ))}
              {(!currentRoom?.aspirants ||
                currentRoom.aspirants.length === 0) && (
                <p className="text-gray-500 text-sm">Esperando Reales...</p>
              )}
            </div>
          </div>
        </div>

        {playerRole === "king" && (
          <button
            onClick={startGame}
            disabled={
              !currentRoom?.aspirants || currentRoom.aspirants.length === 0
            }
            className="w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-6 h-6" />
            Iniciar Juego
          </button>
        )}

        {playerRole === "aspirant" && (
          <div className="text-center text-gray-600">
            <p>Esperando que el Lider inicie el juego...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyScreen;