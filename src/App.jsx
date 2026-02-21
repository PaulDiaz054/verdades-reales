import "./mockStorage.js";
import useGameRoom from "./hooks/useGameRoom";
import MenuScreen from "./components/MenuScreen";
import LobbyScreen from "./components/LobbyScreen";
import PlayingScreen from "./components/PlayingScreen";
import ResultsScreen from "./components/ResultsScreen";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const VerdaderosReales = () => {
  const gameRoom = useGameRoom();

  return (
    <div className="font-sans">
      <Analytics />
      <SpeedInsights />
      {gameRoom.gameState === "menu" && <MenuScreen {...gameRoom} />}
      {gameRoom.gameState === "lobby" && <LobbyScreen {...gameRoom} />}
      {gameRoom.gameState === "playing" && <PlayingScreen {...gameRoom} />}
      {gameRoom.gameState === "results" && <ResultsScreen {...gameRoom} />}
    </div>
  );
};

export default VerdaderosReales;
