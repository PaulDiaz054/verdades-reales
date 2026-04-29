import { useState, useEffect, useRef } from "react";
import { Crown, Shuffle, User } from "lucide-react";
import AdBanner from "./AdBanner";
import storage from "../services/storage.js";

export default function KingPickScreen({ currentRoom, playerRole, pickKing, pickRandomKing, roomCode }) {
  const [highlighted, setHighlighted] = useState(null);
  const [winner, setWinner]           = useState(null);
  const [spinning, setSpinning]       = useState(false);
  const spinRef                        = useRef(false);

  const isAdmin = playerRole === "admin";

  const everyone = [
    currentRoom.admin,
    ...(currentRoom.aspirants || []),
  ];

  // No-admin: esperar a que aparezca winnerId en la sala, luego animar
  useEffect(() => {
    if (isAdmin || spinRef.current) return;
    const timer = setInterval(async () => {
      try {
        const result = await storage.get(`room_${roomCode}`);
        const room   = JSON.parse(result.value);
        const winnerId = room.pickingAnimation?.winnerId;
        if (winnerId && !spinRef.current) {
          clearInterval(timer);
          const chosen = everyone.find((p) => p.id === winnerId);
          if (chosen) runAnimation(chosen);
        }
      } catch (_) {}
    }, 500);
    return () => clearInterval(timer);
  }, [isAdmin]);

  function runAnimation(chosen) {
    if (spinRef.current) return;
    spinRef.current = true;
    setSpinning(true);
    setWinner(null);

    const totalSteps = 24 + Math.floor(Math.random() * 8);
    let step = 0;

    function tick() {
      setHighlighted(everyone[step % everyone.length].id);
      step++;

      const delay = step < totalSteps * 0.6
        ? 100
        : 100 + (step - totalSteps * 0.6) * 35;

      if (step < totalSteps) {
        setTimeout(tick, delay);
      } else {
        setHighlighted(chosen.id);
        setWinner(chosen);
        setSpinning(false);
        spinRef.current = false;
      }
    }
    tick();
  }

  async function handleRandom() {
    if (spinRef.current) return;

    // 1. Elegir ganador
    const chosen = everyone[Math.floor(Math.random() * everyone.length)];

    // 2. Persistir ganador para que los demás lo lean y animen
    try {
      const snap = { ...currentRoom, pickingAnimation: { winnerId: chosen.id } };
      await storage.set(`room_${roomCode}`, JSON.stringify(snap));
    } catch (_) {}

    // 3. Animar localmente en el admin
    runAnimation(chosen);

    // 4. Tras la animación, confirmar el líder
    const animDuration = (24 * 100) + (12 * 35) + 1200;
    setTimeout(() => pickRandomKing(chosen.id), animDuration);
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="w-full p-3"><AdBanner slot="top" /></div>

      <div className="flex-1 w-full p-4 flex flex-col items-center">
        <div className="w-full sm:max-w-2xl bg-white sm:rounded-2xl shadow-xl p-5">

          <div className="text-center mb-6">
            <Crown className="w-14 h-14 mx-auto mb-2 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-800">¿Quién es el Líder?</h2>
            <p className="text-gray-500 text-sm mt-1">
              {isAdmin
                ? "Elige tú o deja que el azar decida"
                : `${currentRoom?.admin?.name} está eligiendo al Líder`}
            </p>
          </div>

          {/* Grilla — visible para todos */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {everyone.map((person) => {
              const isHighlighted = highlighted === person.id;
              const isWinner      = winner?.id === person.id;
              return (
                <div key={person.id}
                  className={`p-4 rounded-xl border-2 text-center transition-all duration-100
                    ${isWinner
                      ? "bg-yellow-100 border-yellow-400 scale-105"
                      : isHighlighted
                        ? "bg-purple-200 border-purple-500 scale-105"
                        : "bg-gray-50 border-gray-200"}`}>
                  <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center
                    ${isWinner ? "bg-yellow-400" : isHighlighted ? "bg-purple-400" : "bg-gray-200"}`}>
                    {isWinner
                      ? <Crown className="w-5 h-5 text-white" />
                      : <User className={`w-5 h-5 ${isHighlighted ? "text-white" : "text-gray-500"}`} />}
                  </div>
                  <p className="font-semibold text-gray-800 truncate text-sm">{person.name}</p>
                  {person.id === currentRoom.admin?.id && (
                    <span className="text-xs text-purple-500 font-medium">Admin</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Controles — solo admin */}
          {isAdmin && !winner && (
            <>
              <button
                onClick={handleRandom}
                disabled={spinning}
                className="w-full bg-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 mb-3 border-0">
                <Shuffle className="w-5 h-5" />
                {spinning ? "Eligiendo..." : "Líder Random"}
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">o elige manualmente</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="space-y-2">
                {everyone.map((person) => (
                  <button key={person.id}
                    onClick={() => pickKing(person.id)}
                    disabled={spinning}
                    className="w-full bg-gray-50 border-2 border-gray-200 text-gray-800 p-3 rounded-xl font-semibold hover:border-purple-400 hover:bg-purple-50 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="truncate">{person.name}</span>
                    {person.id === currentRoom.admin?.id && (
                      <span className="ml-auto text-xs text-purple-500 font-medium flex-shrink-0">Admin</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {!isAdmin && !winner && !spinning && (
            <p className="text-center text-sm text-gray-400 animate-pulse mt-2">
              Esperando decisión del administrador...
            </p>
          )}

          {winner && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 text-center mt-2">
              <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-1" />
              <p className="font-bold text-gray-800 text-lg">{winner.name} es el Líder</p>
            </div>
          )}

        </div>
      </div>

      <div className="w-full p-3"><AdBanner slot="bottom" /></div>
    </div>
  );
}
