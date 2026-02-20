import { useState, useEffect, useRef } from "react";
import questionsData from "../assets/questions_es.json";

const GENERIC_QUESTIONS = questionsData.genericas;
const LIMIT_QUESTIONS = 15;

// Intervalo de polling según el estado del juego y rol del jugador
const getPollingInterval = (gameState, playerRole, currentRoom) => {
  // Fuera del juego: sin polling
  if (gameState === "menu" || gameState === "results") return null;

  // Lobby: el rey espera que se unan jugadores, aspirantes esperan que inicie
  if (gameState === "lobby") return 3000;

  // Jugando:
  if (gameState === "playing" && currentRoom) {
    // El rey valida respuestas → solo necesita saber cuando llegan respuestas
    if (playerRole === "king") {
      const hayRespuestasPendientes = currentRoom.currentAnswers?.length > 0;
      // Si ya hay respuestas visibles, no necesita polling urgente
      return hayRespuestasPendientes ? null : 2000;
    }

    // Aspirante: si ya respondió, espera al rey → polling lento
    // Si no respondió aún, es su turno → sin polling (espera input)
    if (playerRole === "aspirant") {
      const currentQuestion =
        currentRoom.questions?.[currentRoom.currentQuestionIndex];
      const yaRespondio = currentRoom.currentAnswers?.some(
        (a) => a.aspirantName === null // se reemplaza abajo con playerName
      );
      return 3000; // siempre polling lento para aspirante esperando validación
    }
  }

  return 3000; // fallback seguro
};

const useGameRoom = () => {
  const [gameState, setGameState] = useState("menu");
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerRole, setPlayerRole] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  // Usamos ref para acceder a valores actuales dentro del intervalo
  const playerNameRef = useRef(playerName);
  const playerRoleRef = useRef(playerRole);
  const roomCodeRef = useRef(roomCode);
  const currentRoomRef = useRef(currentRoom);
  const gameStateRef = useRef(gameState);

  useEffect(() => { playerNameRef.current = playerName; }, [playerName]);
  useEffect(() => { playerRoleRef.current = playerRole; }, [playerRole]);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);
  useEffect(() => { currentRoomRef.current = currentRoom; }, [currentRoom]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    if (gameState === "menu" || gameState === "results" || !roomCode) return;

    // Calculamos el intervalo según contexto
    const interval = getPollingInterval(gameState, playerRole, currentRoom);
    if (!interval) return;

    const timer = setInterval(async () => {
      await loadRoom();
    }, interval);

    return () => clearInterval(timer);
  }, [gameState, playerRole, currentRoom?.currentAnswers?.length, roomCode]);

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
      code: code,
      mode: mode,
      king: { name: playerName, id: Date.now().toString() },
      aspirants: [],
      questions: questions,
      currentQuestionIndex: 0,
      currentAnswers: [],
      status: "waiting",
      scores: {},
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
      const result = await window.storage.get(
        `room_${roomCode.toUpperCase()}`,
        true
      );

      if (!result) {
        alert("Sala no encontrada");
        return;
      }

      const room = JSON.parse(result.value);
      const aspirantId = Date.now().toString();
      const newAspirant = { name: playerName, id: aspirantId };

      if (!room.aspirants) room.aspirants = [];
      room.aspirants.push(newAspirant);
      room.scores[aspirantId] = 0;

      await window.storage.set(
        `room_${roomCode.toUpperCase()}`,
        JSON.stringify(room),
        true
      );

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

        if (room.status === "answering" && gs === "lobby") {
          setGameState("playing");
        }

        if (room.status === "finished" && gs !== "results") {
          setGameState("results");
        }
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
      (a) => a.name === playerName
    )?.id;

    const answerData = {
      aspirantId: aspirantId,
      aspirantName: playerName,
      questionId: currentQuestion.id,
      answer: answer,
      timestamp: Date.now(),
    };

    try {
      const room = { ...currentRoom };
      if (!room.currentAnswers) room.currentAnswers = [];

      const existingIndex = room.currentAnswers.findIndex(
        (a) => a.aspirantId === aspirantId
      );
      if (existingIndex >= 0) {
        room.currentAnswers[existingIndex] = answerData;
      } else {
        room.currentAnswers.push(answerData);
      }

      await window.storage.set(`room_${roomCode}`, JSON.stringify(room), true);
      setCurrentRoom(room);
    } catch (error) {
      alert("Error al enviar respuesta: " + error.message);
    }
  };

  const validateAnswer = async (aspirantId, isCorrect) => {
    try {
      const room = { ...currentRoom };

      if (isCorrect) {
        room.scores[aspirantId] = (room.scores[aspirantId] || 0) + 1;
      }

      if (!room.answeredAspirants) room.answeredAspirants = [];
      if (!room.answeredAspirants.includes(aspirantId)) {
        room.answeredAspirants.push(aspirantId);
      }

      room.currentAnswers = room.currentAnswers.filter(
        (a) => a.aspirantId !== aspirantId
      );

      if (room.currentAnswers.length === 0) {
        room.currentQuestionIndex++;
        room.answeredAspirants = [];

        if (room.currentQuestionIndex >= room.questions.length) {
          room.status = "finished";
        }
      }

      await window.storage.set(`room_${roomCode}`, JSON.stringify(room), true);
      setCurrentRoom(room);
    } catch (error) {
      alert("Error al validar respuesta: " + error.message);
    }
  };

  const resetGame = () => {
    setGameState("menu");
    setCurrentRoom(null);
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