import useGameRoom from "./hooks/useGameRoom";
import MenuScreen from "./components/MenuScreen";
import LobbyScreen from "./components/LobbyScreen";
import PlayingScreen from "./components/PlayingScreen";
import ResultsScreen from "./components/ResultsScreen";
import CreateQuestionScreen from "./components/CreateQuestionScreen";
import WaitingForQuestionScreen from "./components/WaitingForQuestionScreen";
import KingPickScreen from "./components/KingPickScreen";
import KingRevealScreen from "./components/KingRevealScreen";
import Toast from "./components/Toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const VerdaderosReales = () => {
  const gameRoom = useGameRoom();

  const effectiveRole = gameRoom.playerRole === "admin_king" ? "king" : gameRoom.playerRole;

  return (
    <div className="font-sans">
      <Analytics />
      <SpeedInsights />

      {/* Toast global de errores */}
      <Toast
        message={gameRoom.errorMsg}
        onClose={() => {}}
      />

      {gameRoom.gameState === "menu"             && <MenuScreen {...gameRoom} />}
      {gameRoom.gameState === "lobby"            && <LobbyScreen {...gameRoom} />}
      {gameRoom.gameState === "picking_king"     && <KingPickScreen {...gameRoom} />}
      {gameRoom.gameState === "king_reveal"      && <KingRevealScreen {...gameRoom} />}
      {gameRoom.gameState === "playing"          && <PlayingScreen {...gameRoom} playerRole={effectiveRole} />}
      {gameRoom.gameState === "results"          && <ResultsScreen {...gameRoom} />}
      {gameRoom.gameState === "creating_question" && <CreateQuestionScreen {...gameRoom} playerRole={effectiveRole} />}
      {gameRoom.gameState === "waiting_question"  && <WaitingForQuestionScreen {...gameRoom} />}
    </div>
  );
};

export default VerdaderosReales;
