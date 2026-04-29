import { Crown, Loader } from "lucide-react";
import AdBanner from "./AdBanner";

export default function WaitingForQuestionScreen({ currentRoom }) {
  const roundNum    = (currentRoom?.currentQuestionIndex ?? 0) + 1;
  const totalRounds = currentRoom?.config?.rounds ?? 10;

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="w-full p-3"><AdBanner slot="top" /></div>

      <div className="flex-1 w-full p-4 flex flex-col items-center justify-center">
        <div className="w-full sm:max-w-2xl bg-white sm:rounded-2xl shadow-xl p-8 text-center">

          <div className="flex justify-end mb-2">
            <span className="text-purple-600 font-bold">Ronda {roundNum}/{totalRounds}</span>
          </div>

          <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Esperando al Lider...
          </h2>
          <p className="text-gray-500 mb-6">
            <span className="font-semibold text-gray-700">{currentRoom?.king?.name}</span> está escribiendo la pregunta de esta ronda
          </p>

          <div className="flex justify-center">
            <Loader className="w-8 h-8 text-purple-400 animate-spin" />
          </div>

        </div>
      </div>

      <div className="w-full p-3"><AdBanner slot="bottom" /></div>
    </div>
  );
}
