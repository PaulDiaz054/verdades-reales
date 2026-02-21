import { useState, useEffect, useRef } from "react";
import questionsData from "../assets/questions_es.json";

const GENERIC_QUESTIONS = questionsData.genericas;
const LIMIT_QUESTIONS = 10;

const BASE_URL = import.meta.env.VITE_SERVER_URL
  ? `${import.meta.env.VITE_SERVER_URL}/api/room`
  : "/api/room";

const getPollingInterval = (gameState, playerRole, currentRoom, playerName) => {
  if (gameState === "menu" || gameState === "results") return null;
  if (gameState === "lobby") return 3000;

  if (gameState === "playing" && currentRoom) {
    if (playerRole === "king") {
      const totalAspirantes = currentRoom.aspirants?.length || 0;
      const respuestasRecibidas = currentRoom.currentAnswers?.length || 0;
      const todosRespondieron =
        totalAspirantes > 0 && respuestasRecibidas >= totalAspirantes;
      return todosRespondieron ? null : 2000;
    }

    if (playerRole === "aspirant") {
      const aspirantId = currentRoom.aspirants?.find(
        (a) => a.name === playerName,
      )?.id;
      const currentQuestionId =
        currentRoom.questions?.[currentRoom.currentQuestionIndex]?.id;
      const myAnswer = currentRoom.currentAnswers?.find(
        (a) =>
          a.aspirantId === aspirantId &&
          String(a.questionId) === String(currentQuestionId),
      );
      const alreadyValidated =
        currentRoom.answeredAspirants?.includes(aspirantId);
      const hasAnswered = !!myAnswer || alreadyValidated;
      return hasAnswered ? 1500 : null; // ✅ 1500ms en vez de null cuando ya respondió
    }
  }

  return 3000;
};

const useGameRoom = () => {
  const [gameState, setGameState] = useState("menu");
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerRole, setPlayerRole] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());

  const playerNameRef = useRef(playerName);
  const playerRoleRef = useRef(playerRole);
  const roomCodeRef = useRef(roomCode);
  const currentRoomRef = useRef(currentRoom);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);
  useEffect(() => {
    playerRoleRef.current = playerRole;
  }, [playerRole]);
  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (gameState === "menu" || gameState === "results" || !roomCode) return;

    const interval = getPollingInterval(
      gameState,
      playerRole,
      currentRoom,
      playerName,
    );
    if (!interval) return;

    const timer = setInterval(async () => {
      await loadRoom();
    }, interval);

    return () => clearInterval(timer);
  }, [
    gameState,
    playerRole,
    currentRoom?.currentAnswers?.length,
    roomCode,
    playerName,
  ]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async (mode) => {
    if (!playerName.trim()) {
      alert("Por favor ingresa tu nombre");
      return;
    }

    let questions = mode === "generic" ? shuffleArray(GENERIC_QUESTIONS) : [];
    if (LIMIT_QUESTIONS && mode === "generic") {
      questions = questions.slice(0, LIMIT_QUESTIONS);
    }

    const code = generateRoomCode();
    const room = {
      code,
      mode,
      king: { name: playerName, id: Date.now().toString() },
      aspirants: [],
      questions,
      currentQuestionIndex: 0,
      currentAnswers: [],
      status: "waiting",
      scores: {},
      answeredAspirants: [],
    };

    try {
      setLoading(true);
      await window.storage.set(`room_${code}`, JSON.stringify(room), true);
      setRoomCode(code);
      setPlayerRole("king");
      setCurrentRoom(room);
      setGameState("lobby");
    } catch (error) {
      alert("Error al crear la sala: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      alert("Por favor ingresa tu nombre y código de sala");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: roomCode.toUpperCase(), playerName }),
      });

      if (response.status === 404) {
        alert("Sala no encontrada");
        return;
      }
      if (!response.ok) {
        const data = await response.json();
        alert("Error al unirse: " + (data.error || response.statusText));
        return;
      }

      const { room } = await response.json();
      setPlayerRole("aspirant");
      setCurrentRoom(room);
      setGameState("lobby");
    } catch (error) {
      alert("Error al unirse a la sala: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRoom = async () => {
    const code = roomCodeRef.current;
    if (!code) return;

    try {
      const result = await window.storage.get(`room_${code}`, true);
      if (result) {
        const room = JSON.parse(result.value);
        setCurrentRoom(room);

        const gs = gameStateRef.current;
        if (room.status === "answering" && gs === "lobby")
          setGameState("playing");
        if (room.status === "finished" && gs !== "results")
          setGameState("results");
      }
    } catch (error) {
      console.error("Error loading room:", error);
    }
  };

  const startGame = async () => {
    try {
      const room = { ...currentRoom, status: "answering" };
      await window.storage.set(`room_${roomCode}`, JSON.stringify(room), true);
      setCurrentRoom(room);
      setGameState("playing");
    } catch (error) {
      alert("Error al iniciar juego: " + error.message);
    }
  };

  const submitAnswer = async (answer) => {
    const currentQuestion =
      currentRoom.questions[currentRoom.currentQuestionIndex];
    const aspirantId = currentRoom.aspirants.find(
      (a) => a.name === playerName,
    )?.id;

    setAnsweredQuestions((prev) =>
      new Set(prev).add(currentRoom.currentQuestionIndex),
    );

    try {
      const response = await fetch(`${BASE_URL}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          aspirantId,
          aspirantName: playerName,
          questionId: currentQuestion.id,
          answer,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(
          "Error al enviar respuesta: " + (data.error || response.statusText),
        );
        return;
      }

      const { room } = await response.json();
      setCurrentRoom(room);
    } catch (error) {
      alert("Error al enviar respuesta: " + error.message);
    }
  };

  const validateAnswer = async (aspirantId, isCorrect) => {
    try {
      const response = await fetch(`${BASE_URL}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode, aspirantId, isCorrect }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(
          "Error al validar respuesta: " + (data.error || response.statusText),
        );
        return;
      }

      const { room } = await response.json();
      setCurrentRoom(room);
    } catch (error) {
      alert("Error al validar respuesta: " + error.message);
    }
  };

  const resetGame = () => {
    setGameState("menu");
    setCurrentRoom(null);
    setAnsweredQuestions(new Set());
    setRoomCode("");
    setPlayerRole(null);
  };

  return {
    gameState,
    roomCode,
    playerName,
    playerRole,
    currentRoom,
    loading,
    answeredQuestions,
    setRoomCode,
    setPlayerName,
    createRoom,
    joinRoom,
    startGame,
    submitAnswer,
    validateAnswer,
    resetGame,
  };
};

export default useGameRoom;
