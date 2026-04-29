import { useState, useEffect, useRef } from "react";
import questionsData from "../assets/questions_es.json";
import storage from "../services/storage.js";

const GENERIC_QUESTIONS = questionsData.genericas;

const BASE_URL = import.meta.env.VITE_SERVER_URL
  ? `${import.meta.env.VITE_SERVER_URL}/api/room`
  : "/api/room";

// ─── Sesión persistente ───────────────────────────────────────────────────────
const SESSION_KEY = "vr_session";

function saveSession(data) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch (_) {}
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (_) { return null; }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
}

export const DEFAULT_CONFIG = {
  rounds: 10,
  pointsPerAnswer: 1,
  mode: "generic",
};

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

export default function useGameRoom() {
  const [gameState, setGameState]                 = useState("menu");
  const [roomCode, setRoomCode]                   = useState("");
  const [playerName, setPlayerName]               = useState("");
  const [playerRole, setPlayerRole]               = useState(null); // "admin" | "king" | "aspirant" | "admin_king"
  const [currentRoom, setCurrentRoom]             = useState(null);
  const [loading, setLoading]                     = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [gameConfig, setGameConfig]               = useState(DEFAULT_CONFIG);
  const [reconnecting, setReconnecting]           = useState(false);

  const refs = {
    roomCode:    useRef(roomCode),
    currentRoom: useRef(currentRoom),
    gameState:   useRef(gameState),
    playerRole:  useRef(playerRole),
  };
  useEffect(() => { refs.roomCode.current    = roomCode;    }, [roomCode]);
  useEffect(() => { refs.currentRoom.current = currentRoom; }, [currentRoom]);
  useEffect(() => { refs.gameState.current   = gameState;   }, [gameState]);
  useEffect(() => { refs.playerRole.current  = playerRole;  }, [playerRole]);

  useEffect(() => {
    if (gameState === "menu" || !roomCode) return;
    const timer = setInterval(loadRoom, 3000);
    return () => clearInterval(timer);
  }, [gameState, playerRole, currentRoom?.currentAnswers?.length, roomCode, playerName]);

  async function loadRoom() {
    const code = refs.roomCode.current;
    if (!code) return;
    try {
      const result = await storage.get(`room_${code}`);
      const room   = JSON.parse(result.value);
      setCurrentRoom(room);

      const gs   = refs.gameState.current;
      let   role = refs.playerRole.current;

      // Si el jugador ya salió al menú, ignorar todo
      if (gs === "menu") return;

      // ── Calcular rol efectivo según la sala actual ──────────────────────────
      // Si la sala está en waiting (revancha), forzar rol base
      let effectiveRole = role;
      if (room.status === "waiting") {
        effectiveRole = (role === "king" || role === "admin_king")
          ? (role === "admin_king" ? "admin" : "aspirant")
          : role;
        if (effectiveRole !== role) {
          setPlayerRole(effectiveRole);
          role = effectiveRole;
        }
      }

      // Si hay king asignado y no estamos en waiting, actualizar rol
      if (room.king && room.status !== "waiting" && room.status !== "picking_king") {
        const myName = playerName;
        if (room.king.name === myName && role === "admin")    { setPlayerRole("admin_king"); role = "admin_king"; }
        if (room.king.name === myName && role === "aspirant") { setPlayerRole("king");       role = "king";       }
      }

      // ── Transiciones de gameState ─────────────────────────────────────────
      if (room.status === "picking_king" && gs === "lobby") { setGameState("picking_king"); return; }

      if (room.status === "king_reveal" && gs === "picking_king") { setGameState("king_reveal"); return; }

      if (room.status === "answering" && (gs === "lobby" || gs === "picking_king" || gs === "king_reveal")) {
        setGameState("playing"); return;
      }

      if (room.mode === "custom" && room.status === "waiting_question" &&
          (gs === "picking_king" || gs === "king_reveal" || gs === "playing" || gs === "waiting_question")) {
        // Usar el rol YA actualizado arriba
        const isKingRole = role === "king" || role === "admin_king";
        setGameState(isKingRole ? "creating_question" : "waiting_question");
        return;
      }

      if (room.mode === "custom" && room.status === "answering" && gs === "waiting_question") {
        setGameState("playing"); return;
      }

      if (room.status === "finished" && gs !== "results") { setGameState("results"); return; }

      // Revancha: el admin reinició la sala, todos vuelven al lobby
      if (room.status === "waiting" && gs === "results") { setGameState("lobby"); return; }

    } catch (err) {
      console.error("loadRoom:", err);
    }
  }

  async function reconnectSession(session) {
    const { code, name } = session;
    if (!code || !name) { clearSession(); return; }

    setReconnecting(true);
    try {
      const result = await storage.get(`room_${code}`);
      const room   = JSON.parse(result.value);

      setRoomCode(code);
      setPlayerName(name);
      setCurrentRoom(room);

      // Determinar rol exacto según el estado actual de la sala
      const isAdmin = room.admin?.name === name;
      const isKing  = room.king?.name  === name;

      let effectiveRole;
      if (isAdmin && isKing)       effectiveRole = "admin_king";
      else if (isAdmin)            effectiveRole = "admin";
      else if (isKing)             effectiveRole = "king";
      else                         effectiveRole = "aspirant";

      setPlayerRole(effectiveRole);

      // Determinar gameState según status de la sala y rol
      let gs = "lobby";
      if (room.status === "waiting")          gs = "lobby";
      else if (room.status === "picking_king") gs = "picking_king";
      else if (room.status === "king_reveal")  gs = "king_reveal";
      else if (room.status === "answering")    gs = "playing";
      else if (room.status === "waiting_question") {
        gs = (effectiveRole === "king" || effectiveRole === "admin_king")
          ? "creating_question"
          : "waiting_question";
      }
      else if (room.status === "finished")    gs = "results";

      setGameState(gs);
      saveSession({ code, name, role: effectiveRole });

    } catch (_) {
      clearSession();
    } finally {
      setReconnecting(false);
    }
  }

  async function createRoom() {
    if (!playerName.trim()) return alert("Por favor ingresa tu nombre");

    const isCustom  = gameConfig.mode === "custom";
    const questions = isCustom
      ? []
      : shuffleArray(GENERIC_QUESTIONS).slice(0, gameConfig.rounds);

    const adminId = Date.now().toString();
    const code    = generateRoomCode();
    const room    = {
      code,
      mode: gameConfig.mode,
      config: gameConfig,
      admin: { name: playerName, id: adminId },
      king: null,
      aspirants: [],
      questions,
      currentQuestionIndex: 0,
      currentAnswers: [],
      answeredAspirants: [],
      status: "waiting",
      scores: {},
      answers: {},
      createdAt: new Date().toISOString(),
      startedAt: null,
      finishedAt: null,
    };

    try {
      setLoading(true);
      await storage.set(`room_${code}`, JSON.stringify(room));
      setRoomCode(code);
      setPlayerRole("admin");
      setCurrentRoom(room);
      setGameState("lobby");
      saveSession({ code, name: playerName, role: "admin" });
    } catch (err) {
      alert("Error al crear la sala: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function joinRoom() {
    if (!playerName.trim() || !roomCode.trim())
      return alert("Por favor ingresa tu nombre y código de sala");

    const code = roomCode.toUpperCase();
    setLoading(true);

    try {
      // Verificar si el jugador ya pertenece a esta sala (reconexión)
      let existingRoom = null;
      try {
        const result = await storage.get(`room_${code}`);
        existingRoom = JSON.parse(result.value);
      } catch (_) {}

      if (existingRoom) {
        const isAdmin    = existingRoom.admin?.name === playerName;
        const isKing     = existingRoom.king?.name  === playerName;
        const isAspirant = (existingRoom.aspirants || []).some((a) => a.name === playerName);

        if (isAdmin || isKing || isAspirant) {
          // Reconectar
          await reconnectSession({ code, name: playerName, role: isAdmin ? "admin" : "aspirant" });
          return;
        }
      }

      // Unirse como nuevo jugador
      const { room } = await apiPost("join", {
        roomCode: code,
        playerName,
      });
      setPlayerRole("aspirant");
      setCurrentRoom(room);
      setGameState("lobby");
      saveSession({ code, name: playerName, role: "aspirant" });
    } catch (err) {
      alert("Error al unirse: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Admin inicia → va a pantalla de elegir líder
  async function startGame() {
    try {
      const room = {
        ...currentRoom,
        status: "picking_king",
        startedAt: new Date().toISOString(),
      };
      await storage.set(`room_${roomCode}`, JSON.stringify(room));
      setCurrentRoom(room);
      setGameState("picking_king");
    } catch (err) {
      alert("Error al iniciar: " + err.message);
    }
  }

  // Admin elige un líder (manual o resultado de random)
  async function pickKing(personId) {
    try {
      const everyone = [currentRoom.admin, ...(currentRoom.aspirants || [])];
      const chosen   = everyone.find((p) => p.id === personId);
      if (!chosen) return;

      const isCustom = currentRoom.mode === "custom";

      // Si el elegido era aspirante, sacarlo de aspirants
      const aspirants = currentRoom.aspirants.filter((a) => a.id !== personId);

      // Siempre sacar al elegido de aspirants (incluido el admin)
      const finalAspirants = aspirants;

      // Inicializar scores y answers para todos (incluido admin cuando no es líder)
      const scores  = { ...currentRoom.scores };
      const answers = { ...currentRoom.answers };

      if (!scores[personId])  scores[personId]  = 0;
      if (!answers[personId]) answers[personId] = [];

      // Admin siempre juega (como líder o como aspirante) — garantizar su entrada en scores/answers
      scores[currentRoom.admin.id]  = scores[currentRoom.admin.id]  ?? 0;
      answers[currentRoom.admin.id] = answers[currentRoom.admin.id] ?? [];

      finalAspirants.forEach((a) => {
        if (!scores[a.id])  scores[a.id]  = 0;
        if (!answers[a.id]) answers[a.id] = [];
      });

      const room = {
        ...currentRoom,
        king: chosen,
        aspirants: finalAspirants,
        scores,
        answers,
        status: "king_reveal",
        pendingStatus: isCustom ? "waiting_question" : "answering",
      };
      await storage.set(`room_${roomCode}`, JSON.stringify(room));
      setCurrentRoom(room);

      // Actualizar rol local del admin
      if (personId === currentRoom.admin.id) {
        setPlayerRole("admin_king");
      }

      setGameState("king_reveal");
    } catch (err) {
      alert("Error al elegir líder: " + err.message);
    }
  }

  // Llamado desde KingRevealScreen para continuar al juego
  async function confirmKingAndStart() {
    try {
      const room = {
        ...currentRoom,
        status: currentRoom.pendingStatus,
        pendingStatus: null,
      };
      await storage.set(`room_${roomCode}`, JSON.stringify(room));
      setCurrentRoom(room);

      const role     = refs.playerRole.current;
      const isCustom = room.mode === "custom";

      if (role === "king" || role === "admin_king") {
        setGameState(isCustom ? "creating_question" : "playing");
      } else {
        setGameState(isCustom ? "waiting_question" : "playing");
      }
    } catch (err) {
      alert("Error al iniciar: " + err.message);
    }
  }

  // Igual que pickKing pero llamado tras la animación random
  async function pickRandomKing(personId) {
    await pickKing(personId);
  }

  async function submitCustomQuestion(question) {
    try {
      const questions = [...(currentRoom.questions || [])];
      questions[currentRoom.currentQuestionIndex] = question;
      const room = {
        ...currentRoom,
        questions,
        status: "answering",
        currentAnswers: [],
        answeredAspirants: [],
      };
      await storage.set(`room_${roomCode}`, JSON.stringify(room));
      setCurrentRoom(room);
      setGameState("playing");
    } catch (err) {
      alert("Error al enviar pregunta: " + err.message);
    }
  }

  async function submitAnswer(answer) {
    const question   = currentRoom.questions[currentRoom.currentQuestionIndex];
    // El admin juega como aspirante — buscarlo también en currentRoom.admin
    const aspirantId =
      currentRoom.aspirants.find((a) => a.name === playerName)?.id ||
      (currentRoom.admin?.name === playerName ? currentRoom.admin.id : undefined);

    setAnsweredQuestions((prev) => new Set(prev).add(currentRoom.currentQuestionIndex));

    try {
      const { room } = await apiPost("answer", {
        roomCode,
        aspirantId,
        aspirantName: playerName,
        questionId: question.id,
        answer,
      });
      setCurrentRoom(room);
    } catch (err) {
      alert("Error al enviar respuesta: " + err.message);
    }
  }

  async function validateAnswer(aspirantId, isCorrect) {
    try {
      const pointsPerAnswer = currentRoom.config?.pointsPerAnswer ?? 1;
      const { room } = await apiPost("validate", {
        roomCode,
        aspirantId,
        isCorrect,
        pointsPerAnswer,
      });
      setCurrentRoom(room);

      if (room.status === "finished") {
        setGameState("results");
      } else if (room.mode === "custom" && room.status === "waiting_question") {
        const role = refs.playerRole.current;
        if (role === "king" || role === "admin_king") setGameState("creating_question");
      }
    } catch (err) {
      alert("Error al validar: " + err.message);
    }
  }

  async function updateRoomConfig(newConfig) {
    try {
      const isCustom  = newConfig.mode === "custom";
      const questions = isCustom
        ? []
        : shuffleArray(GENERIC_QUESTIONS).slice(0, newConfig.rounds);
      const room = { ...currentRoom, mode: newConfig.mode, config: newConfig, questions };
      await storage.set(`room_${roomCode}`, JSON.stringify(room));
      setCurrentRoom(room);
      setGameConfig(newConfig);
    } catch (err) {
      alert("Error al actualizar configuración: " + err.message);
    }
  }

  async function rematch() {
    try {
      const isCustom  = currentRoom.config?.mode === "custom";
      const questions = isCustom
        ? []
        : shuffleArray(GENERIC_QUESTIONS).slice(0, currentRoom.config?.rounds ?? 10);

      // Reconstruir lista limpia usando scores como fuente de verdad
      // Solo incluir jugadores que aún tienen entrada en scores (no salieron)
      const activeIds = new Set(Object.keys(currentRoom.scores || {}));

      const playerMap = new Map();

      // Agregar aspirants activos
      (currentRoom.aspirants || []).forEach((p) => {
        if (p.id !== currentRoom.admin?.id && activeIds.has(p.id))
          playerMap.set(p.id, p);
      });

      // Devolver al king si no era el admin y sigue activo
      if (currentRoom.king && currentRoom.king.id !== currentRoom.admin?.id
          && activeIds.has(currentRoom.king.id)) {
        playerMap.set(currentRoom.king.id, currentRoom.king);
      }

      const allPlayers = Array.from(playerMap.values());

      const scores  = {};
      const answers = {};
      allPlayers.forEach((p) => { scores[p.id] = 0; answers[p.id] = []; });
      // Admin juega como aspirante — inicializar su entrada también
      if (currentRoom.admin) {
        scores[currentRoom.admin.id]  = 0;
        answers[currentRoom.admin.id] = [];
      }

      const room = {
        ...currentRoom,
        king: null,
        aspirants: allPlayers,
        questions,
        currentQuestionIndex: 0,
        currentAnswers: [],
        answeredAspirants: [],
        status: "waiting",
        scores,
        answers,
        pickingAnimation: null,
        startedAt: null,
        finishedAt: null,
      };

      await storage.set(`room_${roomCode}`, JSON.stringify(room));
      setCurrentRoom(room);
      setAnsweredQuestions(new Set());
      setPlayerRole("admin");   // resetear rol al estado inicial
      setGameState("lobby");
    } catch (err) {
      alert("Error al iniciar revancha: " + err.message);
    }
  }

  async function resetGame() {
    const code = refs.roomCode.current;
    const room = refs.currentRoom.current;
    const role = refs.playerRole.current;

    if (code && room && role !== "admin") {
      try {
        // Buscar el id del jugador en cualquier lugar de la sala
        const myId =
          (room.aspirants || []).find((a) => a.name === playerName)?.id ||
          (room.king?.name === playerName ? room.king.id : null);

        const updated = {
          ...room,
          aspirants: (room.aspirants || []).filter((a) => a.name !== playerName),
        };

        // Eliminar de scores y answers para que no aparezca en resultados ni revancha
        if (myId) {
          delete updated.scores?.[myId];
          delete updated.answers?.[myId];
          // Eliminar de currentAnswers si respondió esta ronda
          updated.currentAnswers = (updated.currentAnswers || []).filter(
            (a) => a.aspirantId !== myId
          );
          // Eliminar de answeredAspirants
          updated.answeredAspirants = (updated.answeredAspirants || []).filter(
            (id) => id !== myId
          );
        }

        await storage.set(`room_${code}`, JSON.stringify(updated));
      } catch (_) {}
    }

    clearSession();
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
    gameConfig,
    setRoomCode,
    setPlayerName,
    setGameConfig,
    createRoom,
    joinRoom,
    startGame,
    pickKing,
    pickRandomKing,
    submitAnswer,
    submitCustomQuestion,
    validateAnswer,
    updateRoomConfig,
    reconnecting,
    confirmKingAndStart,
    rematch,
    resetGame,
  };
}
