import { Crown, Users, Play, Settings } from "lucide-react";
import AdBanner from "./AdBanner";
import GameConfigModal from "./GameConfigModal";
import { useState } from "react";

export default function LobbyScreen({ roomCode, playerRole, currentRoom, startGame, gameConfig, setGameConfig, updateRoomConfig }) {
  const aspirants = currentRoom?.aspirants || [];
  const [showConfig, setShowConfig] = useState(false);

  async function handleConfigSave(newConfig) {
    setGameConfig(newConfig);
    await updateRoomConfig(newConfig);
    setShowConfig(false);
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-purple-50 to-indigo-100">

      {showConfig && (
        <GameConfigModal
          config={gameConfig}
          onChange={() => {}}
          onClose={() => setShowConfig(false)}
          onSave={handleConfigSave}
        />
      )}

      <div className="w-full p-3"><AdBanner slot="top" /></div>

      <div className="flex-1 w-full p-4 flex flex-col items-center">
        <div className="w-full sm:max-w-2xl bg-white sm:rounded-2xl shadow-xl p-5">

          <div className="text-center mb-5">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Sala de Espera</h2>
            <div className="bg-gray-100 rounded-xl p-4 inline-block">
              <p className="text-sm text-gray-600">Código de Sala</p>
              <p className="text-4xl font-bold text-purple-600 tracking-widest">{roomCode}</p>
            </div>
          </div>

          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4 mb-4 flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-gray-800">El Lider</p>
              <p className="text-gray-700">{currentRoom?.king?.name}</p>
            </div>
          </div>

          {/* Configuración de la partida */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-500" />
                <p className="font-bold text-gray-800">Configuración</p>
              </div>
              {playerRole === "king" && (
                <button
                  onClick={() => setShowConfig(true)}
                  className="text-sm text-purple-600 font-semibold hover:text-purple-800 border-0 bg-transparent p-1 active:scale-95 transition-all"
                >
                  Editar
                </button>
              )}
            </div>
            <div className="flex gap-4 mt-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{currentRoom?.config?.rounds ?? gameConfig.rounds}</p>
                <p className="text-xs text-gray-500">Rondas</p>
              </div>
              <div className="w-px bg-purple-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{currentRoom?.config?.pointsPerAnswer ?? gameConfig.pointsPerAnswer}</p>
                <p className="text-xs text-gray-500">Pts por acierto</p>
              </div>
              <div className="w-px bg-purple-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {(currentRoom?.config?.rounds ?? gameConfig.rounds) * (currentRoom?.config?.pointsPerAnswer ?? gameConfig.pointsPerAnswer)}
                </p>
                <p className="text-xs text-gray-500">Máximo pts</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-100 border-2 border-blue-400 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-6 h-6 text-blue-600" />
              <p className="font-bold text-gray-800">Reales ({aspirants.length})</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {aspirants.length ? (
                aspirants.map((a) => (
                  <div key={a.id} className="bg-white p-2 rounded-lg">
                    <p className="text-gray-700 truncate">{a.name}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm col-span-2">Esperando Reales...</p>
              )}
            </div>
          </div>

          {playerRole === "king" ? (
            <button
              onClick={startGame}
              disabled={!aspirants.length}
              className="w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-6 h-6" />
              Iniciar Juego
            </button>
          ) : (
            <p className="text-center text-gray-600">Esperando que el Lider inicie el juego...</p>
          )}

        </div>
      </div>

      <div className="w-full p-3"><AdBanner slot="bottom" /></div>
    </div>
  );
}
