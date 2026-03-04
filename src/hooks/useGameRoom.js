import { useState, useEffect, useRef } from "react";
import questionsData from "../assets/questions_es.json";
import storage from "../services/storage.js";

// ─── Constantes ───────────────────────────────────────────────────────────────

const GENERIC_QUESTIONS = questionsData.genericas;
const QUESTIONS_LIMIT   = 10;

const BASE_URL = import.meta.env.VITE_SERVER_URL
  ? `${import.meta.env.VITE_SERVER_URL}/api/room`
  : "/api/room";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffleArray(array) {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function apiPost(path, body) {
  const res = await fetch(`${BASE_URL}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText);
  }
  return res.json();
}

function getPollingInterval(gameState, playerRole, currentRoom, playerName) {
  if (!currentRoom || gameState === "menu" || gameState === "results") return null;
  if (gameState === "lobby") return 3000;

  if (gameState === "playing") {
    if (playerRole === "king") {
      const allAnswered =
        currentRoom.aspirants?.length > 0 &&
        currentRoom.currentAnswers?.length >= currentRoom.aspirants.length;
      return allAnswered ? null : 2000;
    }

    if (playerRole === "aspirant") {
      const me  = currentRoom.aspirants?.find((a) => a.name === playerName);
      const qId = currentRoom.questions?.[currentRoom.currentQuestionIndex]?.id;
      const answered =
        currentRoom.currentAnswers?.some(
          (a) => a.aspirantId === me?.id && String(a.questionId) === String(qId)
        ) || currentRoom.answeredAspirants?.includes(me?.id);
      return answered ? 1500 : null;
    }
  }

  return 3000;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export default function useGameRoom() {
  const [gameState,         setGameState]         = useState("menu");
  const [roomCode,          setRoomCode]          = useState("");
  const [playerName,        setPlayerName]        = useState("");
  const [playerRole,        setPlayerRole]        = useState(null);
  const [currentRoom,       setCurrentRoom]       = useState(null);
  const [loading,           setLoading]           = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());

  const refs = {
    roomCode:    useRef(roomCode),
    currentRoom: useRef(currentRoom),
    gameState:   useRef(gameState),
  };
  useEffect(() => { refs.roomCode.current    = roomCode;    }, [roomCode]);
  useEffect(() => { refs.currentRoom.current = currentRoom; }, [currentRoom]);
  useEffect(() => { refs.gameState.current   = gameState;   }, [gameState]);

  // ── Polling ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState === "menu" || gameState === "results" || !roomCode) return;
    const interval = getPollingInterval(gameState, playerRole, currentRoom, playerName);
    if (!interval) return;
    const timer = setInterval(loadRoom, interval);
    return () => clearInterval(timer);
  }, [gameState, playerRole, currentRoom?.currentAnswers?.length, roomCode, playerName]);

  // ── Acciones ───────────────────────────────────────────────────────────────

  async function loadRoom() {
    const code = refs.roomCode.current;
    if (!code) return;
    try {
      const result = await storage.get(`room_${code}`);
      const room   = JSON.parse(result.value);
      setCurrentRoom(room);
      if (room.status === "answering" && refs.gameState.current === "lobby")
        setGameState("playing");
      if (room.status === "finished" && refs.gameState.current !== "results")
        setGameState("results");
    } catch (err) {
      console.error("loadRoom:", err);
    }
  }

  async function createRoom(mode) {
    if (!playerName.trim()) return alert("Por favor ingresa tu nombre");

    const questions = shuffleArray(GENERIC_QUESTIONS).slice(0, QUESTIONS_LIMIT);
    const code      = generateRoomCode();
    const room      = {
      code,
      mode,
      king:                 { name: playerName, id: Date.now().toString() },
      aspirants:            [],
      questions,
      currentQuestionIndex: 0,
      currentAnswers:       [],
      answeredAspirants:    [],
      status:               "waiting",
      scores:               {},
      answers:              {},
    };

    try {
      setLoading(true);
      await storage.set(`room_${code}`, JSON.stringify(room));
      setRoomCode(code);
      setPlayerRole("king");
      setCurrentRoom(room);
      setGameState("lobby");
    } catch (err) {
      alert("Error al crear la sala: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function joinRoom() {
    if (!playerName.trim() || !roomCode.trim())
      return alert("Por favor ingresa tu nombre y código de sala");
    try {
      setLoading(true);
      const { room } = await apiPost("join", {
        roomCode: roomCode.toUpperCase(),
        playerName,
      });
      setPlayerRole("aspirant");
      setCurrentRoom(room);
      setGameState("lobby");
    } catch (err) {
      alert("Error al unirse: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function startGame() {
    try {
      const room = { ...currentRoom, status: "answering" };
      await storage.set(`room_${roomCode}`, JSON.stringify(room));
      setCurrentRoom(room);
      setGameState("playing");
    } catch (err) {
      alert("Error al iniciar juego: " + err.message);
    }
  }

  async function submitAnswer(answer) {
    const question   = currentRoom.questions[currentRoom.currentQuestionIndex];
    const aspirantId = currentRoom.aspirants.find((a) => a.name === playerName)?.id;

    setAnsweredQuestions((prev) => new Set(prev).add(currentRoom.currentQuestionIndex));

    try {
      const { room } = await apiPost("answer", {
        roomCode,
        aspirantId,
        aspirantName: playerName,
        questionId:   question.id,
        answer,
      });
      setCurrentRoom(room);
    } catch (err) {
      alert("Error al enviar respuesta: " + err.message);
    }
  }

  async function validateAnswer(aspirantId, isCorrect) {
    try {
      const { room } = await apiPost("validate", { roomCode, aspirantId, isCorrect });
      setCurrentRoom(room);
    } catch (err) {
      alert("Error al validar respuesta: " + err.message);
    }
  }

  function resetGame() {
    setGameState("menu");
    setCurrentRoom(null);
    setAnsweredQuestions(new Set());
    setRoomCode("");
    setPlayerRole(null);
  }

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
}