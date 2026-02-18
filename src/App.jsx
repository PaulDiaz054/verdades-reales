import "./mockStorage.js";
import useGameRoom from "./hooks/useGameRoom";
import MenuScreen from "./components/MenuScreen";
import LobbyScreen from "./components/LobbyScreen";
import PlayingScreen from "./components/PlayingScreen";
import ResultsScreen from "./components/ResultsScreen";

const VerdaderosReales = () => {
  const gameRoom = useGameRoom();

  return (
    <div className="font-sans">
      {gameRoom.gameState === "menu" && <MenuScreen {...gameRoom} />}
      {gameRoom.gameState === "lobby" && <LobbyScreen {...gameRoom} />}
      {gameRoom.gameState === "playing" && <PlayingScreen {...gameRoom} />}
      {gameRoom.gameState === "results" && <ResultsScreen {...gameRoom} />}
    </div>
  );
};

export default VerdaderosReales;