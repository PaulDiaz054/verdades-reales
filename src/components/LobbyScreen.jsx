import { Crown, Users, Play, Settings, Shuffle } from "lucide-react";
import AdBanner from "./AdBanner";
import GameConfigModal from "./GameConfigModal";
import { useState } from "react";

export default function LobbyScreen({ roomCode, playerRole, currentRoom, startGame, gameConfig, setGameConfig, updateRoomConfig }) {
  const aspirants  = currentRoom?.aspirants || [];
  const [showConfig, setShowConfig] = useState(false);

  async function handleConfigSave(newConfig) {
    setGameConfig(newConfig);
    await updateRoomConfig(newConfig);
    setShowConfig(false);
  }

  const isAdmin = playerRole === "admin";

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-purple-50 to-indigo-100">

      {showConfig && (
        <GameConfigModal
          config={gameConfig}
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

          {/* Admin badge */}
          <div className="bg-indigo-100 border-2 border-indigo-300 rounded-xl p-3 mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-indigo-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-indigo-500 font-semibold">Administrador</p>
              <p className="font-bold text-gray-800">{currentRoom?.admin?.name}</p>
            </div>
          </div>

          {/* Configuración */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-500" />
                <p className="font-bold text-gray-800">Configuración</p>
              </div>
              {isAdmin && (
                <button onClick={() => setShowConfig(true)}
                  className="text-sm text-purple-600 font-semibold hover:text-purple-800 border-0 bg-transparent p-1 active:scale-95 transition-all">
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
              <div className="w-px bg-purple-200" />
              <div className="text-center">
                <p className="text-sm font-bold text-purple-600 mt-1">
                  {(currentRoom?.config?.mode ?? gameConfig.mode) === "custom" ? "Personalizado" : "Genérico"}
                </p>
                <p className="text-xs text-gray-500">Modo</p>
              </div>
            </div>
          </div>

          {/* Jugadores */}
          <div className="bg-blue-100 border-2 border-blue-400 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-6 h-6 text-blue-600" />
              <p className="font-bold text-gray-800">Jugadores ({aspirants.length})</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {aspirants.length ? (
                aspirants.map((a) => (
                  <div key={a.id} className="bg-white p-2 rounded-lg">
                    <p className="text-gray-700 truncate">{a.name}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm col-span-2">Esperando jugadores...</p>
              )}
            </div>
          </div>

          {isAdmin ? (
            <button
              onClick={startGame}
              disabled={!aspirants.length}
              className="w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-0"
            >
              <Play className="w-6 h-6" />
              Iniciar Juego
            </button>
          ) : (
            <p className="text-center text-gray-600">Esperando que el administrador inicie el juego...</p>
          )}

        </div>
      </div>

      <div className="w-full p-3"><AdBanner slot="bottom" /></div>
    </div>
  );
}
